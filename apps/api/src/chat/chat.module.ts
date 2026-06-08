import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AIModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [AIModule, PrismaModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
