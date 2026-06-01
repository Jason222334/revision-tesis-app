import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReviewReport(submissionId: string): Promise<Buffer> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            student: true,
            program: true,
          },
        },
        evaluation: {
          include: {
            findings: true,
          },
        },
      },
    });

    if (!submission || !submission.evaluation) {
      throw new NotFoundException('Evaluación no encontrada para esta entrega');
    }

    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      // Título
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Azul
      doc.text('REPORTE DE REVISIÓN IA', margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Gris
      doc.text('Sistema Inteligente de Evaluación de Tesis', margin, y);
      y += 15;

      // Línea divisoria
      doc.setDrawColor(37, 99, 235);
      doc.line(margin, y, 190, y);
      y += 15;

      // Información del Proyecto
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL PROYECTO', margin, y);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Título: ${submission.project.title}`, margin, y, { maxWidth: 170 });
      y += (submission.project.title.length > 80 ? 15 : 10);
      
      doc.text(`Estudiante: ${submission.project.student.name}`, margin, y);
      y += 7;
      doc.text(`Programa: ${submission.project.program.name}`, margin, y);
      y += 7;
      doc.text(`Versión: ${submission.version}`, margin, y);
      y += 15;

      // Puntaje
      doc.setFillColor(239, 246, 255);
      doc.rect(margin, y, 170, 25, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(`ÍNDICE DE CUMPLIMIENTO: ${submission.evaluation.overallScore}%`, margin + 50, y + 15);
      y += 35;

      // Resumen IA
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('RESUMEN EJECUTIVO', margin, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(submission.evaluation.aiSummary, 170);
      doc.text(splitSummary, margin, y);
      y += (splitSummary.length * 5) + 15;

      // Hallazgos
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('HALLAZGOS Y RECOMENDACIONES', margin, y);
      y += 10;

      for (const finding of submission.evaluation.findings) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${finding.section} [${finding.severity}]`, margin, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(finding.description, 160);
        doc.text(splitDesc, margin + 5, y);
        y += (splitDesc.length * 5) + 4;

        doc.setFont('helvetica', 'italic');
        doc.setTextColor(22, 101, 52);
        const splitSug = doc.splitTextToSize(`Sugerencia: ${finding.aiSuggestion}`, 160);
        doc.text(splitSug, margin + 5, y);
        doc.setTextColor(0, 0, 0);
        y += (splitSug.length * 5) + 10;
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('Este reporte fue generado automáticamente por la IA.', 105, 285, { align: 'center' });

      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new InternalServerErrorException('Error al generar el reporte PDF: ' + error.message);
    }
  }
}
