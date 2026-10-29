// Khớp với Prisma Enum SkillType & TargetSkill
export type SkillType = 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING' | 'MIXED';
export type TargetSkill = 'Listening' | 'Speaking' | 'Reading' | 'Writing';

export type LessonStatus = 
  | 'DRAFT' 
  | 'PENDING_REVIEW' 
  | 'CHANGES_REQUESTED' 
  | 'APPROVED' 
  | 'PUBLISHED';

// Cấu trúc DTO gửi sang Backend
export interface GenerateLessonDto {
  grade: number; // 1 - 9 (Bắt buộc number)
  topic: string; // Tên chủ đề (string)
  skill: TargetSkill; // Viết hoa chữ cái đầu
}

export interface UpdateLessonDto {
  title?: string;
  topicId?: string;
  gradeId?: string;
  skill?: SkillType;
  duration?: number;
  difficulty?: string;
  status?: LessonStatus;
  content?: Record<string, unknown>; 
}

// Cấu trúc AI response trả về
export interface AIGeneratedContent {
  objectives?: string[];
  vocabulary?: Array<{
    word: string;
    phonetic?: string;
    meaning?: string;
    exampleSentence?: string;
  }>;
  grammar?: {
    structure: string;
    explanation?: string;
    note?: string;
  };
  activities?: Array<{
    stage: string;
    name?: string;
    activityName?: string;
    desc?: string;
    duration?: string;
  }>;
}