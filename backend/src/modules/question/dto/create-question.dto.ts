import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsOptional()
  gradeId?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  lessonId?: string;

  @IsInt()
  @Min(1)
  @Max(9)
  @IsOptional()
  grade?: number;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsEnum(['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'REORDER_SENTENCE', 'TRUE_FALSE'])
  type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | 'MATCHING' | 'REORDER_SENTENCE' | 'TRUE_FALSE';

  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  @IsOptional()
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';

  @IsString()
  @IsNotEmpty()
  prompt: string;

  // Cho phép nhận content hoặc options tùy ý
  @IsOptional()
  content?: any;

  @IsOptional()
  options?: any;

  @IsNotEmpty()
  correctAnswer: any;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  // Bổ sung authorId để hết lỗi ở dòng 78
  @IsString()
  @IsOptional()
  authorId?: string;
}

export class BatchCreateQuestionsDto {
  @IsArray()
  questions: CreateQuestionDto[];

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsString()
  @IsOptional()
  gradeId?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  lessonId?: string;
}