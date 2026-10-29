export type ExerciseType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_IN_BLANK'
  | 'MATCHING'
  | 'REORDER_SENTENCE'
  | 'TRUE_FALSE';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// Định nghĩa kiểu rõ ràng cho đáp án thay cho any
export type CorrectAnswerType = 
  | string 
  | boolean 
  | number 
  | string[] 
  | Record<string, string>;

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QuestionOptions {
  options?: string[];
  shuffledWords?: string[];
  pairs?: MatchingPair[];
  hint?: string;
  context?: string;
}

export interface QuestionItem {
  id?: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  content: string; // Đề bài
  options?: QuestionOptions;
  correctAnswer: CorrectAnswerType; // Thay any bằng CorrectAnswerType
  explanation?: string;
  tags?: string[];
  gradeId?: string;
  topicId?: string;
  lessonId?: string;
  createdAt?: string;
}

export interface GenerateExerciseInput {
  grade: number;
  topic: string;
  types: ExerciseType[];
  difficulty: DifficultyLevel;
  totalCount: number;
  context?: string;
  lessonId?: string;
  topicId?: string;
  gradeId?: string;
}