import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AudioTtsService } from './audio-tts.service';

@Module({
  controllers: [AIController], 
  providers: [AIService, AudioTtsService],
  exports: [AIService, AudioTtsService],
})
export class AIModule {}