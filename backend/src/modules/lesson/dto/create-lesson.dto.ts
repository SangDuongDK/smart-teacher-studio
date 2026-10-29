import { IsNotEmpty, IsString, IsEnum, IsInt, Min, IsOptional, IsObject } from 'class-validator';
import { SkillType } from '@prisma/client';

export class CreateLessonDto {
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsNotEmpty()
  @IsEnum(SkillType, { message: 'Kỹ năng phải thuộc: LISTENING, SPEAKING, READING, WRITING, MIXED' })
  skill: SkillType;

  @IsNotEmpty()
  @IsInt()
  @Min(15, { message: 'Thời lượng tối thiểu là 15 phút' })
  duration: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsObject()
  initialContent?: Record<string, any>;
}