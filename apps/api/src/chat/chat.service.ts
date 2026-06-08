import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async getChatResponse(message: string) {
    try {
      // 1. Obtener estadísticas del sistema
      const totalProjects = await this.prisma.thesisProject.count();
      const totalSubmissions = await this.prisma.submission.count();
      const approvedSubmissions = await this.prisma.submission.count({
        where: { status: 'APPROVED' },
      });
      const pendingSubmissions = await this.prisma.submission.count({
        where: { status: 'PENDING' },
      });
      const totalUsers = await this.prisma.user.count();
      const totalPrograms = await this.prisma.program.count();

      const statsContext = `
        Estadísticas actuales del sistema de Revisión de Tesis:
        - Total de proyectos de tesis: ${totalProjects}
        - Total de entregas (submissions): ${totalSubmissions}
        - Entregas aprobadas: ${approvedSubmissions}
        - Entregas pendientes de revisión: ${pendingSubmissions}
        - Usuarios registrados: ${totalUsers}
        - Programas académicos: ${totalPrograms}
      `;

      // 2. Usar AIService para generar la respuesta
      return await this.aiService.chat(message, statsContext);
    } catch (error) {
      this.logger.error(`Error en ChatService: ${error.message}`);
      return 'Lo siento, en este momento no puedo procesar tu pregunta. Por favor intenta más tarde.';
    }
  }
}
