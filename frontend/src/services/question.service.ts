import { apiClient } from '@/lib/api-client';
import {
  ExerciseType,
  DifficultyLevel,
  GenerateExerciseInput,
  QuestionItem,
} from '@/types/question';

interface RawExerciseItem {
  type: ExerciseType;
  difficulty: DifficultyLevel;
  prompt?: string;
  content?: string;
  options?: string[];
  shuffledWords?: string[];
  pairs?: { left: string; right: string }[];
  hint?: string;
  context?: string;
  correctAnswer: QuestionItem['correctAnswer'];
  explanation?: string;
  tags?: string[];
}

interface QuestionQueryParams {
  type?: string;
  difficulty?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const questionService = {
  // 1. Gọi Gemini sinh bài tập
  async generateExercises(payload: GenerateExerciseInput): Promise<QuestionItem[]> {
    const res = await apiClient.post('/ai/generate-exercises', payload);
    const rawList: RawExerciseItem[] = res.data?.data?.exercises || res.data?.data || [];

    return rawList.map((item: RawExerciseItem) => ({
      type: item.type,
      difficulty: item.difficulty,
      content: item.prompt || item.content || '',
      options: {
        options: item.options,
        shuffledWords: item.shuffledWords,
        pairs: item.pairs,
        hint: item.hint,
        context: item.context,
      },
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      tags: item.tags || [payload.topic],
    }));
  },

  // 2. Lưu hàng loạt vào Ngân hàng câu hỏi
  async saveBatch(questions: QuestionItem[], authorId?: string): Promise<{ count: number }> {
    const payload = {
      questions: questions.map((q) => ({
        prompt: q.content,
        type: q.type,
        difficulty: q.difficulty,
        content: q.options || {},
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        tags: q.tags || [],
        gradeId: q.gradeId,
        topicId: q.topicId,
        lessonId: q.lessonId,
      })),
      authorId,
    };

    const res = await apiClient.post('/questions', payload);
    return res.data;
  },

  // 3. Lấy danh sách câu hỏi từ CSDL
  async getQuestions(params?: QuestionQueryParams) {
    const res = await apiClient.get('/questions', { params });
    return res.data;
  },

  // 4. Xóa câu hỏi
  async deleteQuestion(id: string): Promise<void> {
    await apiClient.delete(`/questions/${id}`);
  },
};