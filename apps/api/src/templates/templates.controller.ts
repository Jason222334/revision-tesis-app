import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service';
import { StorageService } from '../storage/storage.service';
import { AIService } from '../ai/ai.service';
import axios from 'axios';

@Controller('templates')
export class TemplatesController {
  private readonly logger = new Logger(TemplatesController.name);

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly storageService: StorageService,
    private readonly aiService: AIService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('programId') programId: string,
  ) {
    this.logger.log(`Uploading and analyzing template: ${name}`);

    const fileName = await this.storageService.uploadFile(file, 'templates');
    const fileUrl = await this.storageService.getFileUrl(fileName);

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // ANÁLISIS MULTIMODAL PARA LA PLANTILLA (OPCIONAL)
    let analysis: any = null;
    try {
      analysis = await this.aiService.analyzeTemplateMultimodal(
        buffer,
        file.mimetype,
      );
    } catch (error) {
      this.logger.warn(`AI analysis failed for template ${name}, saving with empty structure. Error: ${error.message}`);
      // Estructura por defecto si falla la IA para que no se bloquee la subida
      analysis = {
        sections: [
          { title: "Estructura general", description: "Contenido del documento", isRequired: true }
        ],
        formattingRules: {
          citationStyle: "No especificado",
          language: "es"
        }
      };
    }

    return this.templatesService.create({
      name,
      programId,
      fileUrl: fileName,
      structureJson: analysis,
    });
  }

  @Get()
  async findAll(@Query('programId') programId?: string) {
    return this.templatesService.findAll(programId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
