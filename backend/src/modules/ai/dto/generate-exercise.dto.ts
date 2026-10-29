import { IsInt, IsNotEmpty, IsString, IsArray, IsEnum, Min, Max, IsOptional } from 'class-validator';

export class GenerateExerciseDto {
  @IsInt()
  @Min(1)
  @Max(9)
  grade: number;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsArray()
  types: ('MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | 'MATCHING' | 'REORDER_SENTENCE' | 'TRUE_FALSE')[];

  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';

  @IsInt()
  @Min(1)
  @Max(20)
  totalCount: number;

  @IsString()
  @IsOptional()
  context?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;
}