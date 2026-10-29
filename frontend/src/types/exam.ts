import { ExerciseType, DifficultyLevel } from './question';

export interface MatrixItemCriteria {
  type: ExerciseType;
  difficulty: DifficultyLevel;
  count: number;
  point: number;
}

export interface ExamSectionBlueprint {
  sectionId: string;
  name: string;
  questionCount: number;
  items: MatrixItemCriteria[];
}

export interface ExamMatrixBlueprint {
  examType: '15_MIN' | 'MID_TERM' | 'FINAL_TERM' | 'REVIEW';
  gradeLevel: 'PRIMARY' | 'SECONDARY';
  durationMinutes: number;
  totalQuestions: number;
  totalScore: number;
  sections: ExamSectionBlueprint[];
}

// 1. TIỂU HỌC - 15 PHÚT (10 câu - 15 phút)
export const PRIMARY_15MIN_PRESET: ExamMatrixBlueprint = {
  examType: '15_MIN',
  gradeLevel: 'PRIMARY',
  durationMinutes: 15,
  totalQuestions: 10,
  totalScore: 10.0,
  sections: [
    {
      sectionId: 'pri_15m_vocab',
      name: 'Vocabulary & Reading (Từ vựng & Đọc hiểu nhanh)',
      questionCount: 10,
      items: [
        { type: 'MULTIPLE_CHOICE', difficulty: 'EASY', count: 5, point: 1.0 },
        { type: 'FILL_IN_BLANK', difficulty: 'MEDIUM', count: 5, point: 1.0 },
      ],
    },
  ],
};

// 2. TIỂU HỌC - GIỮA KỲ / CUỐI KỲ (20 câu - 35 phút)
export const PRIMARY_MIDTERM_PRESET: ExamMatrixBlueprint = {
  examType: 'MID_TERM',
  gradeLevel: 'PRIMARY',
  durationMinutes: 35,
  totalQuestions: 20,
  totalScore: 10.0,
  sections: [
    {
      sectionId: 'pri_listening',
      name: 'Part I. Listening (Kỹ năng nghe)',
      questionCount: 6,
      items: [
        { type: 'MULTIPLE_CHOICE', difficulty: 'EASY', count: 4, point: 0.5 },
        { type: 'TRUE_FALSE', difficulty: 'MEDIUM', count: 2, point: 0.5 },
      ],
    },
    {
      sectionId: 'pri_reading',
      name: 'Part II. Reading (Đọc hiểu & Từ vựng)',
      questionCount: 6,
      items: [
        { type: 'MATCHING', difficulty: 'EASY', count: 3, point: 0.5 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 3, point: 0.5 },
      ],
    },
    {
      sectionId: 'pri_writing',
      name: 'Part III. Writing (Kỹ năng viết & Ngữ pháp)',
      questionCount: 8,
      items: [
        { type: 'FILL_IN_BLANK', difficulty: 'EASY', count: 4, point: 0.5 },
        { type: 'REORDER_SENTENCE', difficulty: 'MEDIUM', count: 4, point: 0.5 },
      ],
    },
  ],
};

// 3. THCS - 15 PHÚT (10 câu - 15 phút)
export const SECONDARY_15MIN_PRESET: ExamMatrixBlueprint = {
  examType: '15_MIN',
  gradeLevel: 'SECONDARY',
  durationMinutes: 15,
  totalQuestions: 10,
  totalScore: 10.0,
  sections: [
    {
      sectionId: 'sec_15m',
      name: 'Language Review (Kiểm tra nhanh Từ vựng & Ngữ pháp)',
      questionCount: 10,
      items: [
        { type: 'MULTIPLE_CHOICE', difficulty: 'EASY', count: 4, point: 1.0 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 4, point: 1.0 },
        { type: 'REORDER_SENTENCE', difficulty: 'HARD', count: 2, point: 1.0 },
      ],
    },
  ],
};

// 4. THCS - GIỮA KỲ / CUỐI KỲ (40 câu - 45 phút)
export const SECONDARY_MIDTERM_PRESET: ExamMatrixBlueprint = {
  examType: 'MID_TERM',
  gradeLevel: 'SECONDARY',
  durationMinutes: 45,
  totalQuestions: 40,
  totalScore: 10.0,
  sections: [
    {
      sectionId: 'sec_phonetics',
      name: 'I. Phonetics & Stress (Ngữ âm & Trọng âm)',
      questionCount: 4,
      items: [
        { type: 'MULTIPLE_CHOICE', difficulty: 'EASY', count: 2, point: 0.25 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 2, point: 0.25 },
      ],
    },
    {
      sectionId: 'sec_lang_focus',
      name: 'II. Language Focus (Từ vựng & Ngữ pháp)',
      questionCount: 16,
      items: [
        { type: 'MULTIPLE_CHOICE', difficulty: 'EASY', count: 6, point: 0.25 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 6, point: 0.25 },
        { type: 'FILL_IN_BLANK', difficulty: 'MEDIUM', count: 2, point: 0.25 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'HARD', count: 2, point: 0.25 },
      ],
    },
    {
      sectionId: 'sec_reading',
      name: 'III. Reading Comprehension (Đọc hiểu văn bản)',
      questionCount: 10,
      items: [
        { type: 'TRUE_FALSE', difficulty: 'EASY', count: 3, point: 0.25 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 4, point: 0.25 },
        { type: 'MULTIPLE_CHOICE', difficulty: 'HARD', count: 3, point: 0.25 },
      ],
    },
    {
      sectionId: 'sec_writing',
      name: 'IV. Writing & Sentence Transformation (Kỹ năng viết)',
      questionCount: 10,
      items: [
        { type: 'MATCHING', difficulty: 'EASY', count: 2, point: 0.25 },
        { type: 'REORDER_SENTENCE', difficulty: 'MEDIUM', count: 4, point: 0.25 },
        { type: 'REORDER_SENTENCE', difficulty: 'HARD', count: 4, point: 0.25 },
      ],
    },
  ],
};