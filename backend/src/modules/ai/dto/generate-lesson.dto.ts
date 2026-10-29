import { IsInt, Min, Max, IsString, IsOptional, IsNotEmpty, IsEnum, MaxLength, IsNumber } from 'class-validator';

export enum TargetSkill {
  LISTENING = 'Listening',
  SPEAKING = 'Speaking',
  READING = 'Reading',
  WRITING = 'Writing',
}

export class GenerateLessonDto {
  @IsInt({ message: 'Khối lớp phải là số nguyên' })
  @Min(1, { message: 'Khối lớp tối thiểu là Lớp 1' })
  @Max(9, { message: 'Khối lớp tối đa là Lớp 9' })
  grade: number;

  @IsString({ message: 'Chủ đề phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Chủ đề không được để trống' })
  @MaxLength(100, { message: 'Tên chủ đề không được vượt quá 100 ký tự' })
  topic: string;

  @IsEnum(TargetSkill, { message: 'Kỹ năng phải là Listening, Speaking, Reading hoặc Writing' })
  skill: TargetSkill;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  additionalRequirements?: string;
}