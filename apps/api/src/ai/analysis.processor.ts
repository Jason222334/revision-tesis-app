import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { SubmissionStatus } from '@revision-tesis/database';
import axios from 'axios';

@Processor('analysis')
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private aiService: AIService,
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { submissionId } = job.data;
    this.logger.log(`🚀 Iniciando procesamiento de entrega: ${submissionId}`);

    try {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.ANALYZING },
      });

      const submission = await this.prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          project: {
            include: {
              program: {
                include: { templates: { where: { isActive: true } } },
              },
            },
          },
        },
      });

      if (!submission || !submission.project.program.templates[0]) {
        throw new Error('Entrega o Plantilla no encontrada');
      }

      const template = submission.project.program.templates[0];
      const fileUrl = await this.storageService.getFileUrl(submission.fileUrl);

      this.logger.log(`📥 Descargando archivo para Gemini...`);
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(response.data);

      const mimetype = submission.fileUrl.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      // ANÁLISIS DIRECTO CON GEMINI (Multimodal)
      const analysis = await this.aiService.analyzeSubmissionMultimodal(
        buffer,
        mimetype,
        template.structureJson,
      );

      this.logger.log(`💾 Guardando resultados...`);
      await this.prisma.$transaction(async (tx) => {
        const evaluation = await tx.evaluation.create({
          data: {
            submissionId,
            overallScore: analysis.overallScore,
            aiSummary: analysis.aiSummary,
          },
        });

        await tx.finding.createMany({
          data: analysis.findings.map((f: any) => ({
            evaluationId: evaluation.id,
            section: f.section,
            type: f.type,
            severity: f.severity,
            description: f.description,
            aiSuggestion: f.aiSuggestion,
            exampleImprovement: f.exampleImprovement,
          })),
        });

        await tx.submission.update({
          where: { id: submissionId },
          data: { status: SubmissionStatus.REVIEWING },
        });
      });

      this.logger.log(`✅ Entrega analizada con éxito.`);
    } catch (error) {
      this.logger.error(`❌ Error en análisis: ${error.message}`);
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.PENDING },
      });
      throw error;
    }
  }
}
