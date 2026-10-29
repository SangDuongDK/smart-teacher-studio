import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { ExamType, Prisma } from '@prisma/client';

@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  // 1. Tự động bốc câu hỏi từ ngân hàng trước, hết mới gọi AI sinh bù (Lưu ở dạng DRAFT)
  async generateFromMatrix(dto: GenerateExamDto, requestUserId?: string) {
    const { title, durationMinutes, matrixBlueprint } = dto;

    // 1.1. Tìm gradeId theo khối lớp
    let finalGradeId = dto.gradeId;
    const gradeNumber = dto.grade || 1;

    if (!finalGradeId && dto.grade) {
      const gradeRecord = await this.prisma.grade.findFirst({
        where: {
          OR: [
            { name: { contains: `${dto.grade}`, mode: 'insensitive' } },
            { name: `Grade ${dto.grade}` },
            { name: `Lớp ${dto.grade}` },
          ],
        },
      });
      finalGradeId = gradeRecord?.id;
    }

    if (!finalGradeId) {
      const fallbackGrade = await this.prisma.grade.findFirst();
      if (!fallbackGrade) {
        throw new BadRequestException('Hệ thống chưa có dữ liệu Khối lớp (Grade) trong CSDL.');
      }
      finalGradeId = fallbackGrade.id;
    }

    // 1.2. Xác định người tạo
    let finalUserId = requestUserId;
    if (!finalUserId) {
      const firstUser = await this.prisma.user.findFirst();
      finalUserId = firstUser?.id;
    }

    // 1.3. Chuẩn hóa ExamType
    let examTypeEnum: ExamType = ExamType.MID_TERM;
    const rawType = matrixBlueprint.examType;
    if (rawType === '15_MIN' || rawType === 'MINUTES_15') {
      examTypeEnum = ExamType.MINUTES_15;
    } else if (rawType === 'FINAL_TERM') {
      examTypeEnum = ExamType.FINAL_TERM;
    } else if (rawType === 'REVIEW') {
      examTypeEnum = ExamType.REVIEW;
    }

    const selectedQuestions: { questionId: string; pointWeight: number; order: number }[] = [];
    const usedQuestionIds = new Set<string>();
    let currentOrder = 1;
    let bankCount = 0;
    let aiGeneratedCount = 0;

    // 1.4. Duyệt qua từng Section trong Ma trận
    for (const section of matrixBlueprint.sections) {
      for (const item of section.items) {
        // Ưu tiên 1: Lấy toàn bộ câu hỏi đúng khối lớp trong ngân hàng (không lấy câu DRAFT)
        let availableInBank = await this.prisma.question.findMany({
          where: {
            deletedAt: null,
            gradeId: finalGradeId,
            type: item.type as any,
            difficulty: item.difficulty,
            id: { notIn: Array.from(usedQuestionIds) },
            NOT: { tags: { has: 'DRAFT' } },
          },
          select: { id: true },
        });

        // Ưu tiên 2: Nếu chưa đủ, tìm thêm câu hỏi dùng chung (gradeId: null) có sẵn trong ngân hàng
        if (availableInBank.length < item.count) {
          const generalQuestions = await this.prisma.question.findMany({
            where: {
              deletedAt: null,
              gradeId: null,
              type: item.type as any,
              difficulty: item.difficulty,
              id: { notIn: [...Array.from(usedQuestionIds), ...availableInBank.map((q) => q.id)] },
              NOT: { tags: { has: 'DRAFT' } },
            },
            select: { id: true },
          });
          availableInBank = [...availableInBank, ...generalQuestions];
        }

        // Bốc hết toàn bộ số câu có sẵn trong ngân hàng trước
        const numFromBank = Math.min(availableInBank.length, item.count);
        const missingCount = item.count - numFromBank;

        if (numFromBank > 0) {
          const shuffled = availableInBank.sort(() => 0.5 - Math.random());
          const picked = shuffled.slice(0, numFromBank);
          picked.forEach((q) => {
            usedQuestionIds.add(q.id);
            selectedQuestions.push({
              questionId: q.id,
              pointWeight: Number(item.point),
              order: currentOrder++,
            });
            bankCount++;
          });
        }

        // CHỈ KHI HẾT CÂU TRONG NGÂN HÀNG MỚI GỌI AI SINH BÙ PHẦN THIẾU
        if (missingCount > 0) {
          try {
            const aiResult = await this.aiService.generateExercises({
              grade: Number(gradeNumber),
              topic: title,
              types: [item.type as any],
              difficulty: item.difficulty as any,
              totalCount: missingCount,
            });

            for (const itemAi of aiResult.exercises) {
              const ex = itemAi as any;
              const optionsData = {
                options: ex.options,
                shuffledWords: ex.shuffledWords,
                pairs: ex.pairs,
              };

              const finalCorrectAnswer =
                ex.correctAnswer !== undefined && ex.correctAnswer !== null
                  ? ex.correctAnswer
                  : ex.pairs || '';

              const createdQ = await this.prisma.question.create({
                data: {
                  type: ex.type as any,
                  skill: 'READING',
                  difficulty: ex.difficulty,
                  content: ex.prompt,
                  options: optionsData,
                  correctAnswer: finalCorrectAnswer,
                  explanation: ex.explanation,
                  tags: ['AI_GENERATED', 'DRAFT'], // Gắn nhãn DRAFT để ẩn khỏi ngân hàng câu hỏi[cite: 29]
                  gradeId: finalGradeId,
                  createdById: finalUserId || null,
                },
              });

              usedQuestionIds.add(createdQ.id);
              selectedQuestions.push({
                questionId: createdQ.id,
                pointWeight: Number(item.point),
                order: currentOrder++,
              });
              aiGeneratedCount++;
            }
          } catch (error) {
            console.error('Lỗi khi AI sinh bù câu hỏi:', error);
            throw new BadRequestException(
              `Kho câu hỏi thiếu ${missingCount} câu (${item.type} - ${item.difficulty}) và AI gặp sự cố khi tạo bù. Vui lòng thử lại.`
            );
          }
        }
      }
    }

    // 1.5. Tạo đề thi lưu ở dạng Bản nháp (isDraft: true)
    const exam = await this.prisma.$transaction(async (tx) => {
      const createdExam = await tx.exam.create({
        data: {
          title,
          type: examTypeEnum,
          durationMinutes,
          totalScore: new Prisma.Decimal(matrixBlueprint.totalScore || 10.0),
          matrixBlueprint: {
            ...(matrixBlueprint as any),
            isDraft: true, // Đánh dấu là bản nháp chưa lưu chính thức[cite: 29]
          },
          gradeId: finalGradeId!,
          topicId: dto.topicId || null,
          createdById: finalUserId!,
        },
      });

      await tx.examQuestion.createMany({
        data: selectedQuestions.map((sq) => ({
          examId: createdExam.id,
          questionId: sq.questionId,
          pointWeight: new Prisma.Decimal(sq.pointWeight),
          questionOrder: sq.order,
        })),
      });

      return createdExam;
    });

    return {
      statusCode: 201,
      message: 'Khởi tạo đề thi thành công',
      data: exam,
      summary: {
        totalQuestions: selectedQuestions.length,
        bankCount,
        aiGeneratedCount,
      },
    };
  }

  // 2. Danh sách đề thi
  async findAll(query: { page?: number; limit?: number; q?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ExamWhereInput = { deletedAt: null };
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.exam.count({ where }),
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          grade: { select: { id: true, name: true } },
          _count: { select: { examQuestions: true } },
        },
      }),
    ]);

    return {
      statusCode: 200,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // 3. Chi tiết đề thi và thống kê
  async findOne(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        grade: true,
        examQuestions: {
          orderBy: { questionOrder: 'asc' },
          include: {
            question: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Không tìm thấy đề thi với ID: ${id}`);
    }

    const total = exam.examQuestions.length;
    const aiCount = exam.examQuestions.filter((eq) =>
      eq.question.tags?.includes('AI_GENERATED')
    ).length;
    const bankCount = total - aiCount;

    return {
      statusCode: 200,
      data: {
        ...exam,
        stats: { total, bankCount, aiCount },
      },
    };
  }

  // 4. Lấy câu hỏi khác từ Ngân hàng để đổi câu
  async getAlternativeBankQuestions(examId: string, currentQuestionId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { examQuestions: true },
    });
    if (!exam) throw new NotFoundException('Không tìm thấy đề thi');

    const currentQ = await this.prisma.question.findUnique({
      where: { id: currentQuestionId },
    });
    if (!currentQ) throw new NotFoundException('Không tìm thấy câu hỏi hiện tại');

    const usedIds = exam.examQuestions.map((eq) => eq.questionId);

    const alternatives = await this.prisma.question.findMany({
      where: {
        deletedAt: null,
        type: currentQ.type,
        difficulty: currentQ.difficulty,
        id: { notIn: usedIds },
        OR: [{ gradeId: exam.gradeId }, { gradeId: null }],
        NOT: { tags: { has: 'DRAFT' } },
      },
      take: 10,
    });

    return { statusCode: 200, data: alternatives };
  }

  // 5. Đổi sang câu hỏi khác từ ngân hàng
  async swapQuestion(examId: string, oldQuestionId: string, newQuestionId: string) {
    const examQuestion = await this.prisma.examQuestion.findFirst({
      where: { examId, questionId: oldQuestionId },
    });
    if (!examQuestion) throw new NotFoundException('Câu hỏi không thuộc đề thi này');

    await this.prisma.examQuestion.update({
      where: { id: examQuestion.id },
      data: { questionId: newQuestionId },
    });

    return { statusCode: 200, message: 'Đã đổi câu hỏi thành công' };
  }

  // 6. Sinh lại 1 câu khác bằng AI để thay thế câu hiện tại
  async regenerateAiQuestion(examId: string, oldQuestionId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { grade: true, examQuestions: true },
    });
    if (!exam) throw new NotFoundException('Không tìm thấy đề thi');

    const currentQ = await this.prisma.question.findUnique({
      where: { id: oldQuestionId },
    });
    if (!currentQ) throw new NotFoundException('Không tìm thấy câu hỏi hiện tại');

    const gradeNum = parseInt(exam.grade?.name.replace(/\D/g, '') || '1', 10);

    const aiResult = await this.aiService.generateExercises({
      grade: gradeNum,
      topic: exam.title,
      types: [currentQ.type as any],
      difficulty: currentQ.difficulty as any,
      totalCount: 1,
    });

    const ex = aiResult.exercises[0] as any;
    if (!ex) throw new BadRequestException('AI không sinh được câu hỏi thay thế');

    const optionsData = {
      options: ex.options,
      shuffledWords: ex.shuffledWords,
      pairs: ex.pairs,
    };

    const finalCorrectAnswer =
      ex.correctAnswer !== undefined && ex.correctAnswer !== null
        ? ex.correctAnswer
        : ex.pairs || '';

    const newQ = await this.prisma.question.create({
      data: {
        type: ex.type as any,
        skill: 'READING',
        difficulty: ex.difficulty,
        content: ex.prompt,
        options: optionsData,
        correctAnswer: finalCorrectAnswer,
        explanation: ex.explanation,
        tags: ['AI_GENERATED', 'DRAFT'],
        gradeId: exam.gradeId,
        createdById: exam.createdById,
      },
    });

    await this.swapQuestion(examId, oldQuestionId, newQ.id);

    return {
      statusCode: 200,
      message: 'Đã tạo lại câu hỏi mới bằng AI thành công',
      data: newQ,
    };
  }

  // 7. Lưu câu AI tạo bù vào Ngân hàng chính thức đơn lẻ
  async saveAiQuestionToBank(questionId: string) {
    const q = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');

    const newTags = (q.tags || [])
      .filter((t) => t !== 'DRAFT')
      .concat('SAVED_FROM_EXAM');

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: { tags: newTags },
    });

    return {
      statusCode: 200,
      message: 'Đã lưu câu hỏi vào ngân hàng chính thức',
      data: updated,
    };
  }

  // 8. Lưu đề chính thức: Đề thành chính thức và gỡ nhãn DRAFT để lưu các câu AI vào kho[cite: 29]
  async publishExam(id: string) {
    const exam = await this.findOne(id);
    const blueprint = (exam.data?.matrixBlueprint as any) || {};

    await this.prisma.exam.update({
      where: { id },
      data: {
        matrixBlueprint: { ...blueprint, isDraft: false },
      },
    });

    const questionIds = exam.data.examQuestions.map((eq: any) => eq.questionId);
    const draftAiQuestions = await this.prisma.question.findMany({
      where: { 
        id: { in: questionIds }, 
        tags: { has: 'DRAFT' } 
      },
    });

    for (const q of draftAiQuestions) {
      await this.prisma.question.update({
        where: { id: q.id },
        data: {
          tags: q.tags.filter((t: string) => t !== 'DRAFT').concat('SAVED_FROM_EXAM'),
        },
      });
    }

    return { 
      statusCode: 200, 
      message: 'Đã lưu đề thi chính thức và đồng bộ câu hỏi vào Ngân hàng thành công!' 
    };
  }

  // 9. Hủy bản nháp: Xóa đề thi và dọn sạch toàn bộ câu AI sinh bù chưa lưu[cite: 29]
  async discardDraft(id: string) {
    const exam = await this.findOne(id);
    const questionIds = exam.data.examQuestions.map((eq: any) => eq.questionId);

    await this.prisma.exam.delete({ where: { id } });

    await this.prisma.question.deleteMany({
      where: { 
        id: { in: questionIds }, 
        tags: { has: 'DRAFT' } 
      },
    });

    return { statusCode: 200, message: 'Đã hủy bản nháp thành công' };
  }

  // 10. Xóa mềm đề thi chính thức
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { statusCode: 200, message: 'Xóa đề thi thành công' };
  }
}