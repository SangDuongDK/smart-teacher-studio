import { z } from 'zod';

export const LessonPlanZodSchema = z.object({
  targetGrade: z.string().describe('Khối lớp, ví dụ: "Grade 4"'),
  cefrLevel: z.enum(['Pre-A1', 'A1', 'A2', 'B1']).describe('Trình độ CEFR tương ứng'),
  // BỔ SUNG: Kịch bản nghe khi kỹ năng là Listening
  audioScript: z.string().optional().default('').describe('Kịch bản bài nghe / hội thoại khi kỹ năng là Listening'),
  objectives: z.object({
    knowledge: z.array(z.string().min(5)).min(1).describe('Mục tiêu kiến thức'),
    skills: z.array(z.string().min(5)).min(1).describe('Mục tiêu kỹ năng'),
    attitudes: z.array(z.string().min(5)).min(1).describe('Mục tiêu phẩm chất/thái độ'),
  }),
  vocabulary: z.array(
    z.object({
      word: z.string().min(1),
      partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'phrase']),
      phonetic: z.string().startsWith('/').endsWith('/'),
      meaningVi: z.string().min(1),
      exampleSentence: z.string().min(5),
    })
  ).min(3).max(8).describe('Danh sách từ vựng theo lứa tuổi'),
  grammar: z.object({
    targetStructure: z.string().min(3),
    formula: z.string().min(3),
    explanationVi: z.string().min(5),
    commonMistakesVi: z.string().optional(),
    examples: z.array(z.string()).min(2),
  }),
  activities: z.array(
    z.object({
      stage: z.enum(['Warm-up', 'Presentation', 'Controlled Practice', 'Production/Wrap-up']),
      title: z.string().min(3),
      durationMinutes: z.number().int().positive().max(45),
      instructionsVi: z.string().min(10),
      studentActions: z.string().min(5),
    })
  ).min(4).max(5).describe('Tiến trình 4 bước chuẩn sư phạm'),
});

// Trích xuất Type an toàn tự động từ Zod
export type LessonPlanOutput = z.infer<typeof LessonPlanZodSchema>;