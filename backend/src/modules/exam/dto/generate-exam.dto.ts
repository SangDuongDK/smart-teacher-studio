import { 
  IsNotEmpty, 
  IsString, 
  IsInt, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  Min, 
  Max, 
  IsNumber, 
  IsDefined 
} from 'class-validator';
import { Type } from 'class-transformer';

export class MatrixItemCriteriaDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsInt()
  @Min(1)
  count: number;

  @IsNumber()
  @IsNotEmpty()
  point: number;
}

export class ExamSectionBlueprintDto {
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  questionCount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatrixItemCriteriaDto)
  items: MatrixItemCriteriaDto[];
}

export class ExamMatrixBlueprintDto {
  @IsString()
  @IsNotEmpty()
  examType: string;

  @IsString()
  @IsNotEmpty()
  gradeLevel: 'PRIMARY' | 'SECONDARY';

  @IsInt()
  durationMinutes: number;

  @IsInt()
  totalQuestions: number;

  @IsNumber()
  @IsNotEmpty()
  totalScore: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamSectionBlueprintDto)
  sections: ExamSectionBlueprintDto[];
}

export class GenerateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  grade?: number;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsInt()
  durationMinutes: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => ExamMatrixBlueprintDto)
  matrixBlueprint: ExamMatrixBlueprintDto;
}