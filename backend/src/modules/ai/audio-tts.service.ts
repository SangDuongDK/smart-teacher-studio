import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as googleTTS from 'google-tts-api';
import * as fs from 'fs';
import * as path from 'path';

export interface TtsResponse {
  fileUrl: string;
  fileName: string;
  audioBase64: string; // Trả thêm base64 để phát trực tiếp
}

@Injectable()
export class AudioTtsService {
  private cleanScriptForSpeech(script: string): string {
    return script
      .replace(/^[A-Za-z0-9_\s]{2,20}:\s*/gm, '') // Lọc bỏ tên nhân vật ở đầu câu
      .replace(/\[.*?\]/g, '') // Lọc bỏ ghi chú hành động [sound]
      .replace(/\s+/g, ' ')
      .trim();
  }

  async convertScriptToMp3(text: string, lang = 'en'): Promise<TtsResponse> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Văn bản kịch bản không được để trống');
    }

    const cleanSpeech = this.cleanScriptForSpeech(text);

    try {
      const audioChunks = await googleTTS.getAllAudioBase64(cleanSpeech, {
        lang: lang,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 15000,
        splitPunct: ',.?!',
      });

      const audioBuffers = audioChunks.map((chunk) => Buffer.from(chunk.base64, 'base64'));
      const combinedBuffer = Buffer.concat(audioBuffers);

      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `listening-${Date.now()}.mp3`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, combinedBuffer);

      const base64Data = combinedBuffer.toString('base64');

      return {
        fileUrl: `/uploads/${fileName}`,
        fileName,
        audioBase64: `data:audio/mp3;base64,${base64Data}`,
      };
    } catch (err: unknown) {
      console.error('Lỗi khi sinh file TTS:', err);
      throw new InternalServerErrorException('Không thể chuyển đổi văn bản sang âm thanh');
    }
  }
}