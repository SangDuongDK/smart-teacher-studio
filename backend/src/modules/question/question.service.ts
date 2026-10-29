// backend/src/modules/question/question.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, BatchCreateQuestionsDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryQuestionDto) {
    const { page = 1, limit = 10, type, difficulty, q } = query;
    const skip = (page - 1) * limit;

    const where: any = { 
      deletedAt: null,
      NOT: { tags: { has: 'DRAFT' } }, 
    };
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (q) {
      where.content = { contains: q, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      statusCode: 200,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
    });
    if (!question) {
      throw new NotFoundException(`Không tìm thấy câu hỏi ID: ${id}`);
    }

    return {
      statusCode: 200,
      data: question,
    };
  }

  async create(dto: CreateQuestionDto) {
    const promptText = dto.prompt || (typeof dto.content === 'string' ? dto.content : '');
    const optionsData = dto.options ?? (typeof dto.content === 'object' ? dto.content : null);

    const finalCorrectAnswer =
      dto.correctAnswer !== undefined && dto.correctAnswer !== null
        ? dto.correctAnswer
        : (optionsData?.pairs || (dto.content as any)?.pairs || '');

    const question = await this.prisma.question.create({
      data: {
        type: dto.type as any,
        skill: 'READING',
        difficulty: dto.difficulty || 'MEDIUM',
        content: promptText,
        options: optionsData,
        correctAnswer: finalCorrectAnswer,
        explanation: dto.explanation || null,
        tags: dto.tags || [],
        gradeId: dto.gradeId || null,
        topicId: dto.topicId || null,
        lessonId: dto.lessonId || null,
        createdById: null,
      },
    });

    return { statusCode: 201, message: 'Tạo câu hỏi thành công', data: question };
  }

  async createBatch(dto: BatchCreateQuestionsDto) {
    const dataToInsert = dto.questions.map((q: any) => {
      const promptText = q.prompt || (typeof q.content === 'string' ? q.content : '');
      const optionsData = q.options ?? (typeof q.content === 'object' ? q.content : null);

      const finalCorrectAnswer =
        q.correctAnswer !== undefined && q.correctAnswer !== null
          ? q.correctAnswer
          : (optionsData?.pairs || q.pairs || '');

      return {
        type: q.type as any,
        skill: 'READING' as const,
        difficulty: q.difficulty || 'MEDIUM',
        content: promptText,
        options: optionsData,
        correctAnswer: finalCorrectAnswer,
        explanation: q.explanation || null,
        tags: q.tags || [],
        gradeId: q.gradeId || dto.gradeId || null,
        topicId: q.topicId || dto.topicId || null,
        lessonId: q.lessonId || dto.lessonId || null,
        createdById: null,
      };
    });

    const result = await this.prisma.question.createMany({
      data: dataToInsert,
    });

    return {
      statusCode: 201,
      message: `Đã lưu thành công ${result.count} câu hỏi vào ngân hàng`,
      count: result.count,
    };
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);

    const promptText = dto.prompt || (typeof dto.content === 'string' ? dto.content : undefined);
    const optionsData = dto.options ?? (typeof dto.content === 'object' ? dto.content : undefined);

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        ...(promptText && { content: promptText }),
        ...(optionsData !== undefined && { options: optionsData }),
        ...(dto.correctAnswer !== undefined && { correctAnswer: dto.correctAnswer }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.difficulty && { difficulty: dto.difficulty }),
        ...(dto.tags && { tags: dto.tags }),
      },
    });

    return { statusCode: 200, message: 'Cập nhật câu hỏi thành công', data: updated };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { statusCode: 200, message: 'Xóa câu hỏi thành công' };
  }
}