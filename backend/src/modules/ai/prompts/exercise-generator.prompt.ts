export interface ExercisePromptInput {
  grade: number;
  topic: string;
  types: string[];
  difficulty: string;
  totalCount: number;
  context?: string;
}

export function buildExercisePrompt(input: ExercisePromptInput): string {
  const hasContext = Boolean(input.context && input.context.trim() !== "");

  return `
Bạn là chuyên gia sư phạm Tiếng Anh K-9 cho học sinh Việt Nam.
Tạo ${input.totalCount} bài tập tiếng Anh:
- Lớp: ${input.grade}
- Chủ đề: ${input.topic}
- Độ khó: ${input.difficulty}
- Các dạng bài: ${input.types.join(", ")}

${
  hasContext
    ? `=== NGỮ CẢNH / KỊCH BẢN BÀI NGHE (BẮT BUỘC BÁM SÁT 100%) ===
"""
${input.context?.trim()}
"""

YÊU CẦU ĐẶC THÙ CHO BÀI TẬP DỰA TRÊN NGỮ CẢNH:
1. TẤT CẢ các câu hỏi, phương án lựa chọn và đáp án PHẢI khai thác trực tiếp từ dữ liệu, tình tiết, nhân vật và sự việc trong đoạn văn bản/kịch bản trên. Tuyệt đối không hỏi các thông tin chung chung ngoài bài.
2. Đối với dạng TRUE_FALSE: Nội dung câu hỏi phải là các nhận định trực tiếp về thông tin trong bài (ví dụ: tuổi tác, tính cách, thói quen, hành động của nhân vật).
3. Đối với dạng MULTIPLE_CHOICE: Các phương án nhiễu (distractors) phải hợp lý, liên quan đến ngữ cảnh nhưng chỉ có duy nhất 1 đáp án chính xác theo nội dung kịch bản.
4. Đối với dạng FILL_IN_BLANK: Chỗ trống cần điền phải là từ vựng trọng tâm xuất hiện trong đoạn hội thoại.
5. Trường 'explanation': Phải giải thích bằng tiếng Việt và trích dẫn câu thoại/dẫn chứng cụ thể từ kịch bản để chứng minh đáp án đúng.`
    : `YÊU CẦU: Tạo câu hỏi bám sát chuẩn kiến thức, từ vựng và ngữ pháp của chủ đề "${input.topic}" theo độ khó ${input.difficulty}.`
}

Yêu cầu bắt buộc về kỹ thuật & định dạng:
1. Trường 'explanation' phải viết bằng tiếng Việt ngắn gọn, dễ hiểu.
2. Trả về đúng định dạng JSON thuần túy (không dùng cú pháp bọc \`\`\`json).
3. Tuyệt đối KHÔNG chèn mệnh lệnh hoặc tiền tố chỉ dẫn (như "Choose the correct word:", "Choose the correct preposition:", "Complete the word:", "Select the best answer:") vào trường 'prompt'.
4. Đối với dạng REORDER_SENTENCE: trường 'prompt' PHẢI là câu tiếng Anh hoàn chỉnh (đáp án chuẩn), TUYỆT ĐỐI KHÔNG ghi lý thuyết hay tên cấu trúc tiếng Việt (như "Cấu trúc suggest that...", "Mệnh đề trạng ngữ...") vào trường 'prompt'.
`.trim();
}