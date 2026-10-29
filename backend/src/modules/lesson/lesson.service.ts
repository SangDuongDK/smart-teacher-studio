import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';
import { Prisma, LessonStatus, Role } from '@prisma/client';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo bài học mới (Cho phép tạo nháp khi chưa chọn topicId/gradeId)
  async create(userId: string, dto: CreateLessonDto) {
    let gradeId: string | undefined = dto.gradeId;
    let topicId: string | undefined = dto.topicId;

    // Nếu người dùng có gửi topicId thì kiểm tra và lấy gradeId theo topic
    if (topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (topic) {
        gradeId = topic.gradeId;
      } else {
        topicId = undefined; // Thay vì null, dùng undefined
      }
    }

    // Tiến hành tạo bài học nháp trong transaction
    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          title: dto.title || 'Bài học mới',
          gradeId: gradeId || undefined,
          topicId: topicId || undefined,
          authorId: userId,
          primarySkill: dto.skill || 'READING',
          durationMinutes: dto.duration || 45,
          difficultyLevel: dto.difficulty || 'BEGINNER',
          status: LessonStatus.DRAFT,
        },
      });

      // Tạo phiên bản 1 cho bài học nháp
      const initialVersion = await tx.lessonVersion.create({
        data: {
          lessonId: lesson.id,
          versionNumber: 1,
          content: dto.initialContent || { objectives: [], vocabulary: [] },
          createdById: userId,
        },
      });

      // Cập nhật currentVersionId
      return tx.lesson.update({
        where: { id: lesson.id },
        data: { currentVersionId: initialVersion.id },
        include: {
          grade: true,
          topic: true,
          currentVersion: true,
        },
      });
    });
  }

  // 2. Lấy danh sách có phân trang và bộ lọc (bỏ qua bài đã xóa mềm)
  async findAll(userId: string, userRole: Role | string, query: QueryLessonDto) {
    const { page = 1, limit = 10, search, skill, status, gradeId, topicId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {
      deletedAt: null, // Chỉ lấy bài chưa xóa
      ...(userRole === Role.TEACHER ? { authorId: userId } : {}),
      ...(status ? { status } : {}),
      ...(skill ? { primarySkill: skill } : {}),
      ...(gradeId ? { gradeId } : {}),
      ...(topicId ? { topicId } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          grade: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true, unitName: true } },
          author: { select: { id: true, fullName: true, email: true } },
          currentVersion: { select: { id: true, versionNumber: true } },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      items,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        limit: Number(limit),
      },
    };
  }

  // 3. Lấy chi tiết bài học kèm Version hiện tại
  async findOne(id: string, userId: string, userRole: Role | string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      include: {
        grade: true,
        topic: true,
        author: { select: { id: true, fullName: true, email: true } },
        currentVersion: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID: ${id}`);
    }

    if (userRole === Role.TEACHER && lesson.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập bài học này');
    }

    return lesson;
  }

  // 4. Cập nhật bài học và nội dung
  async update(id: string, userId: string, userRole: Role | string, dto: UpdateLessonDto) {
    const lesson = await this.findOne(id, userId, userRole);

    return this.prisma.$transaction(async (tx) => {
      let currentVersionId = lesson.currentVersionId;

      // Nếu có cập nhật nội dung giáo án (content)
      if (dto.content) {
        if (lesson.currentVersion) {
          // Cập nhật đè vào phiên bản hiện tại nếu bài học đang ở trạng thái DRAFT
          await tx.lessonVersion.update({
            where: { id: lesson.currentVersion.id },
            data: { content: dto.content },
          });
        } else {
          // Trường hợp dự phòng nếu chưa có version
          const newVersion = await tx.lessonVersion.create({
            data: {
              lessonId: lesson.id,
              versionNumber: 1,
              content: dto.content,
              createdById: userId,
            },
          });
          currentVersionId = newVersion.id;
        }
      }

      return tx.lesson.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.skill !== undefined ? { primarySkill: dto.skill } : {}),
          ...(dto.duration !== undefined ? { durationMinutes: dto.duration } : {}),
          ...(dto.difficulty !== undefined ? { difficultyLevel: dto.difficulty } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.gradeId !== undefined ? { gradeId: dto.gradeId } : {}),
          ...(dto.topicId !== undefined ? { topicId: dto.topicId } : {}),
          currentVersionId,
          updatedAt: new Date(),
        },
        include: {
          grade: true,
          topic: true,
          currentVersion: true,
        },
      });
    });
  }

  // 5. Xuất bản bài học (Tạo phiên bản mới đóng băng khi Publish)
  async publish(id: string, userId: string, userRole: Role | string) {
    const lesson = await this.findOne(id, userId, userRole);

    return this.prisma.$transaction(async (tx) => {
      const latestVersion = await tx.lessonVersion.findFirst({
        where: { lessonId: id },
        orderBy: { versionNumber: 'desc' },
      });

      const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

      // Tạo một snapshot version mới khi chính thức publish
      const publishedVersion = await tx.lessonVersion.create({
        data: {
          lessonId: id,
          versionNumber: nextVersionNumber,
          content: latestVersion?.content || {},
          createdById: userId,
        },
      });

      return tx.lesson.update({
        where: { id },
        data: {
          status: LessonStatus.PUBLISHED,
          currentVersionId: publishedVersion.id,
          publishedAt: new Date(),
          publishedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          currentVersion: true,
        },
      });
    });
  }

  // 6. Xóa mềm bài học (Soft Delete bằng deletedAt)
  async remove(id: string, userId: string, userRole: Role | string) {
    await this.findOne(id, userId, userRole);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getGrades() {
    return this.prisma.grade.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getTopics(gradeId?: string) {
    return this.prisma.topic.findMany({
      where: gradeId ? { gradeId } : {},
      select: {
        id: true,
        name: true,
        unitName: true,
        gradeId: true,
      },
      orderBy: {
        unitName: 'asc',
      },
    });
  }
}