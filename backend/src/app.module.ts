import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { QuestionModule } from './modules/question/question.module';
import { AIModule } from './modules/ai/ai.module';
import { ExamModule } from './modules/exam/exam.module';

@Module({
imports: [
    PrismaModule,
    AuthModule,
    LessonModule,  
    QuestionModule,
    AIModule,
    ExamModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
