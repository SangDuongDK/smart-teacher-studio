import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryQuestionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  grade?: number;

  @IsOptional()
  @IsEnum(['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'REORDER_SENTENCE', 'TRUE_FALSE'])
  type?: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | 'MATCHING' | 'REORDER_SENTENCE' | 'TRUE_FALSE';

  @IsOptional()
  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional()
  @IsString()
  q?: string;
}