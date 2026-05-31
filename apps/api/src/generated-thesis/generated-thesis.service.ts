import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AIService } from '../ai/ai.service';
import { TemplatesService } from '../templates/templates.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class GeneratedThesisService {
  private readonly logger = new Logger(GeneratedThesisService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private templatesService: TemplatesService,
    private storageService: StorageService,
  ) {}

  async generate(title: string, userId: string) {
    this.logger.log(
      `Iniciando generación para título: ${title} (User: ${userId})`,
    );
    try {
      // 1. Obtener el único documento patrón activo
      const templates = await this.templatesService.findAll();
      this.logger.log(`Total de plantillas encontradas: ${templates.length}`);

      const activeTemplate = templates.find((t) => t.isActive);

      if (!activeTemplate) {
        this.logger.error(
          'No se encontró ningún documento patrón activo en la lista.',
        );
        throw new InternalServerErrorException(
          'No hay un documento patrón activo en el sistema.',
        );
      }

      this.logger.log(`Usando plantilla: ${activeTemplate.name}`);

      // 2. Generar contenido con IA basado en la estructura del patrón
      const content = await this.aiService.generateFullThesisDraft(
        title,
        activeTemplate.structureJson,
      );

      if (!content || content.length < 100) {
        this.logger.error('La IA generó un contenido demasiado corto o vacío.');
        throw new InternalServerErrorException(
          'La IA no pudo generar un borrador válido en este momento.',
        );
      }

      this.logger.log(
        `Generación de IA completada con éxito (${content.length} caracteres).`,
      );

      return {
        title,
        content,
        templateName: activeTemplate.name,
      };
    } catch (error) {
      this.logger.error(`Error en el proceso de generación: ${error.message}`);
      throw error;
    }
  }
}
