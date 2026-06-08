import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async ask(@Body('message') message: string) {
    this.logger.log(`Pregunta recibida: ${message}`);
    const response = await this.chatService.getChatResponse(message);
    this.logger.log(`Respuesta enviada para: ${message}`);
    return { response };
  }
}
