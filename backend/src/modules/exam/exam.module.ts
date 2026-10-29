import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    AIModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}