import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Khởi tạo app với kiểu NestExpressApplication để dùng được các tính năng static file
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Cho phép Frontend gọi API
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 2. Đảm bảo thư mục uploads luôn tồn tại trên ổ đĩa
  const uploadDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 3. Mở quyền truy cập tệp tĩnh cho thư mục uploads (để phát file mp3)
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // 4. Thêm tiền tố /api cho tất cả endpoints (ví dụ: /api/ai/tts)
  app.setGlobalPrefix('api');

  // 5. Tự động kiểm tra tính hợp lệ của DTO qua class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các trường không được khai báo trong DTO
      forbidNonWhitelisted: true, // Ném lỗi nếu client truyền thừa trường
      transform: true, // Tự động convert kiểu dữ liệu phù hợp
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend Server đang chạy tại: http://localhost:${port}/api`);
}

void bootstrap();