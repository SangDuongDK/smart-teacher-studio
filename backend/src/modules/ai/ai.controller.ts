import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { AIService } from './ai.service';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { GenerateExerciseDto } from './dto/generate-exercise.dto';
import { AudioTtsService } from './audio-tts.service';

@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly audioTtsService: AudioTtsService
  ) {}

  @Post('generate-lesson')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async generateLesson(@Body() dto: GenerateLessonDto) {
    const result = await this.aiService.generateLessonPlan(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Sinh giáo án thành công',
      data: result,
    };
  }

  @Post('generate-exercises')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async generateExercises(@Body() dto: GenerateExerciseDto) {
    const result = await this.aiService.generateExercises(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Sinh bài tập thành công',
      data: result,
    };
  }
  @Post('tts')
  async generateAudio(@Body() body: { text: string; lang?: string }) {
    return this.audioTtsService.convertScriptToMp3(body.text, body.lang || 'en');
  }
}