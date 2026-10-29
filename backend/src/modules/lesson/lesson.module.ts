import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { PrismaModule } from '../../prisma/prisma.module'; 

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    PrismaModule,
  ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}