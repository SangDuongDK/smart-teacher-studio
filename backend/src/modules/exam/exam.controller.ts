import { Controller, Post, Get, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ExamService } from './exam.service';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard) 
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('generate-from-matrix')
  async generateFromMatrix(@Body() dto: GenerateExamDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.examService.generateFromMatrix(dto, userId);
  }

  @Get()
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('q') q?: string) {
    return this.examService.findAll({ page, limit, q });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.examService.findOne(id);
  }

  @Get(':id/questions/:questionId/alternatives')
  async getAlternatives(@Param('id') id: string, @Param('questionId') questionId: string) {
    return this.examService.getAlternativeBankQuestions(id, questionId);
  }

  @Post(':id/swap-question')
  async swapQuestion(
    @Param('id') id: string,
    @Body() body: { oldQuestionId: string; newQuestionId: string },
  ) {
    return this.examService.swapQuestion(id, body.oldQuestionId, body.newQuestionId);
  }

  @Post(':id/regenerate-ai-question')
  async regenerateAiQuestion(
    @Param('id') id: string,
    @Body() body: { questionId: string },
  ) {
    return this.examService.regenerateAiQuestion(id, body.questionId);
  }

  @Post('questions/:questionId/save-to-bank')
  async saveToBank(@Param('questionId') questionId: string) {
    return this.examService.saveAiQuestionToBank(questionId);
  }

  @Post(':id/publish')
  async publishExam(@Param('id') id: string) {
    return this.examService.publishExam(id);
  }

  @Delete(':id/draft')
  async discardDraft(@Param('id') id: string) {
    return this.examService.discardDraft(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.examService.remove(id);
  }
}