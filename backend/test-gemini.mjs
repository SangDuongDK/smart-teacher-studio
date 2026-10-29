import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function generateWithRetry(modelName, contents, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  [${modelName}] Lần thử ${attempt}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          responseMimeType: 'application/json',
        },
      });
      return response;
    } catch (error) {
      const isOverloaded = error.message?.includes('503') || error.status === 503;
      if (isOverloaded && attempt < maxRetries) {
        const waitTime = attempt * 3000; // Đợi 3s, 6s...
        console.warn(`Máy chủ bận (503). Đang đợi ${waitTime / 1000}s thử lại...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

async function checkGeminiConnection() {
  console.log('Bắt đầu kiểm tra kết nối Gemini API...');
  
  // Thử model Pro trước (ít nghẽn hơn), sau đó đến flash
  const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash'];

  for (const modelName of candidateModels) {
    try {
      const response = await generateWithRetry(
        modelName,
        'Tạo 1 câu hỏi trắc nghiệm tiếng Anh lớp 5 về chủ đề Con vật (Animals) có đáp án đúng, định dạng JSON.'
      );

      console.log(`\n KẾT NỐI THÀNH CÔNG VỚI MODEL: ${modelName}!`);
      const parsedData = JSON.parse(response.text);
      console.log(parsedData);
      console.log('\n Câu hỏi:', parsedData.question);
      console.log('Đáp án đúng:', parsedData.correct_answer || parsedData.correctAnswer);
      return;
    } catch (error) {
      console.warn(`Model ${modelName} không phản hồi: ${error.message}\n`);
    }
  }

  console.error('Cả 2 model đều đang quá tải. Bạn hãy đợi khoảng 1-2 phút rồi gõ lại lệnh.');
}

checkGeminiConnection();