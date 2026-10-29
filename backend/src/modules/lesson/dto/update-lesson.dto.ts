import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonDto } from './create-lesson.dto';
import { IsOptional, IsEnum, IsObject } from 'class-validator';
import { LessonStatus } from '@prisma/client';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>; // Cập nhật nội dung giáo án
}