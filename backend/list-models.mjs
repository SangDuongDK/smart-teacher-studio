import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listSupportedModels() {
  console.log('Đang kiểm tra danh sách model khả dụng cho API Key của bạn...\n');
  try {
    const response = await ai.models.list();
    
    console.log('--- DANH SÁCH MODEL HỖ TRỢ GENERATE CONTENT ---');
    for await (const model of response) {
      // Lọc các model có hỗ trợ generateContent
      if (model.supportedActions?.includes('generateContent') || !model.supportedActions) {
        console.log(`- ${model.name}`);
      }
    }
    console.log('------------------------------------------------');
  } catch (error) {
    console.error('Lỗi khi lấy danh sách model:', error.message);
  }
}

listSupportedModels();