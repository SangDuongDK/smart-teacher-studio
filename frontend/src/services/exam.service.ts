import { apiClient } from '@/lib/api-client';
import { ExamMatrixBlueprint } from '@/types/exam';

export const examService = {
  // 1. Khởi tạo đề từ Ma trận
  async generateFromMatrix(payload: {
    title: string;
    grade: number;
    durationMinutes: number;
    matrixBlueprint: ExamMatrixBlueprint;
  }) {
    const res = await apiClient.post('/exams/generate-from-matrix', payload);
    return res.data;
  },

  // 2. Danh sách đề thi
  async getExams(params?: { page?: number; limit?: number; q?: string }) {
    const res = await apiClient.get('/exams', { params });
    return res.data;
  },

  // 3. Chi tiết đề thi
  async getExamDetail(id: string) {
    const res = await apiClient.get(`/exams/${id}`);
    return res.data;
  },

  // 4. Lấy danh sách câu hỏi khác từ Ngân hàng để đổi câu
  async getAlternatives(examId: string, questionId: string) {
    const res = await apiClient.get(`/exams/${examId}/questions/${questionId}/alternatives`);
    return res.data;
  },

  // 5. Đổi sang câu hỏi từ ngân hàng
  async swapQuestion(examId: string, oldQuestionId: string, newQuestionId: string) {
    const res = await apiClient.post(`/exams/${examId}/swap-question`, {
      oldQuestionId,
      newQuestionId,
    });
    return res.data;
  },

  // 6. Yêu cầu AI tạo lại 1 câu mới thay thế
  async regenerateAiQuestion(examId: string, questionId: string) {
    const res = await apiClient.post(`/exams/${examId}/regenerate-ai-question`, {
      questionId,
    });
    return res.data;
  },

  // 7. Lưu câu AI tạo bù vào Ngân hàng chính thức đơn lẻ
  async saveAiQuestionToBank(questionId: string) {
    const res = await apiClient.post(`/exams/questions/${questionId}/save-to-bank`);
    return res.data;
  },

  // 8. Lưu bài kiểm tra chính thức (Đồng bộ toàn bộ câu AI vào Ngân hàng)
  async publishExam(id: string) {
    const res = await apiClient.post(`/exams/${id}/publish`);
    return res.data;
  },

  // 9. Hủy bản nháp bài kiểm tra (Xóa đề và dọn sạch các câu AI sinh bù)
  async discardDraft(id: string) {
    const res = await apiClient.delete(`/exams/${id}/draft`);
    return res.data;
  },

  // 10. Xóa đề thi
  async deleteExam(id: string) {
    const res = await apiClient.delete(`/exams/${id}`);
    return res.data;
  },
};