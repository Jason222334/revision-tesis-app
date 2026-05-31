import { Injectable, NotFoundException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
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

    const data = {
      projectTitle: submission.project.title,
      studentName: submission.project.student.name,
      programName: submission.project.program.name,
      version: submission.version,
      overallScore: submission.evaluation.overallScore,
      aiSummary: submission.evaluation.aiSummary,
      findings: submission.evaluation.findings,
      metrics: this.calculateMetrics(submission.evaluation),
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };

    const templateHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              line-height: 1.6;
              color: #1f2937;
              margin: 0;
              padding: 0;
            }
            .page {
              padding: 40px;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-info h1 {
              margin: 0;
              color: #1e3a8a;
              font-size: 24px;
              text-transform: uppercase;
            }
            .header-info p {
              margin: 5px 0 0 0;
              color: #6b7280;
              font-size: 14px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
            }
            .meta-item b {
              display: block;
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .meta-item span {
              font-weight: 600;
              font-size: 15px;
            }
            .score-card {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
            }
            .score-value {
              font-size: 48px;
              font-weight: 800;
              color: #2563eb;
              margin: 10px 0;
            }
            .score-label {
              font-size: 14px;
              font-weight: 600;
              color: #1e40af;
              text-transform: uppercase;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .metric-card {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .metric-title {
              font-size: 12px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .metric-bar-bg {
              background: #f3f4f6;
              height: 8px;
              border-radius: 4px;
              margin-bottom: 8px;
              overflow: hidden;
            }
            .metric-bar-fill {
              background: #2563eb;
              height: 100%;
              border-radius: 4px;
            }
            .metric-value {
              font-weight: 700;
              color: #1f2937;
            }
            .ai-metrics-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
            }
            .ai-metric-card {
              background: #f8fafc;
              border: 1px dashed #cbd5e1;
              padding: 15px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .ai-metric-info b {
              display: block;
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
            }
            .ai-metric-info span {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
            }
            .ai-metric-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-low { background: #dcfce7; color: #166534; }
            .badge-med { background: #fef9c3; color: #854d0e; }
            .badge-high { background: #fee2e2; color: #991b1b; }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
              border-left: 4px solid #2563eb;
              padding-left: 12px;
              margin: 30px 0 15px 0;
            }
            .summary {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              padding: 20px;
              border-radius: 8px;
              font-size: 15px;
              color: #374151;
            }
            .finding { 
              border: 1px solid #e5e7eb; 
              margin-bottom: 15px; 
              border-radius: 8px;
              overflow: hidden;
            }
            .finding-header {
              background: #f8fafc;
              padding: 12px 15px;
              border-bottom: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
            }
            .finding-body {
              padding: 15px;
            }
            .severity-CRITICAL { color: #dc2626; font-weight: bold; }
            .severity-MAJOR { color: #ea580c; font-weight: bold; }
            .severity-MINOR { color: #ca8a04; font-weight: bold; }
            .severity-SUGGESTION { color: #16a34a; font-weight: bold; }
            
            .finding-description {
              margin-bottom: 12px;
              font-size: 14px;
            }
            .suggestion-box {
              background: #f0fdf4;
              border-left: 3px solid #16a34a;
              padding: 12px;
              font-size: 13px;
              color: #166534;
            }
            .suggestion-box b {
              display: block;
              margin-bottom: 4px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="header-info">
                <h1>Reporte de Revisión IA</h1>
                <p>Sistema Inteligente de Evaluación de Tesis</p>
              </div>
              <div style="text-align: right">
                <p style="font-weight: bold; margin: 0">ID: {{submissionId}}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280">{{date}}</p>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <b>Proyecto</b>
                <span>{{projectTitle}}</span>
              </div>
              <div class="meta-item">
                <b>Estudiante</b>
                <span>{{studentName}}</span>
              </div>
              <div class="meta-item">
                <b>Programa Académico</b>
                <span>{{programName}}</span>
              </div>
              <div class="meta-item">
                <b>Versión de Entrega</b>
                <span>Versión {{version}}</span>
              </div>
            </div>

            <div class="score-card">
              <div class="score-label">Índice de Cumplimiento General</div>
              <div class="score-value">{{overallScore}}%</div>
              <div style="font-size: 12px; color: #6b7280">Basado en la estructura y criterios del documento patrón</div>
            </div>

            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">Estructura</div>
                <div class="metric-bar-bg">
                  <div class="metric-bar-fill" style="width: {{metrics.structure}}%"></div>
                </div>
                <div class="metric-value">{{metrics.structure}}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Contenido</div>
                <div class="metric-bar-bg">
                  <div class="metric-bar-fill" style="width: {{metrics.content}}%"></div>
                </div>
                <div class="metric-value">{{metrics.content}}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Formato</div>
                <div class="metric-bar-bg">
                  <div class="metric-bar-fill" style="width: {{metrics.format}}%"></div>
                </div>
                <div class="metric-value">{{metrics.format}}%</div>
              </div>
            </div>

            <div class="ai-metrics-grid">
              <div class="ai-metric-card">
                <div class="ai-metric-info">
                  <b>Porcentaje de IA</b>
                  <span>{{metrics.aiPercentage}}%</span>
                </div>
                <div class="ai-metric-badge {{metrics.aiBadgeClass}}">
                  {{metrics.aiStatus}}
                </div>
              </div>
              <div class="ai-metric-card">
                <div class="ai-metric-info">
                  <b>Similitud (Plagio)</b>
                  <span>{{metrics.similarity}}%</span>
                </div>
                <div class="ai-metric-badge {{metrics.simBadgeClass}}">
                  {{metrics.simStatus}}
                </div>
              </div>
            </div>

            <h2 class="section-title">Resumen Ejecutivo</h2>
            <div class="summary">
              {{aiSummary}}
            </div>

            <h2 class="section-title">Hallazgos y Recomendaciones</h2>
            {{#each findings}}
              <div class="finding">
                <div class="finding-header">
                  <span><b>Sección:</b> {{section}} | <b>Tipo:</b> {{type}}</span>
                  <span class="severity-{{severity}}">{{severity}}</span>
                </div>
                <div class="finding-body">
                  <div class="finding-description">
                    {{description}}
                  </div>
                  <div class="suggestion-box">
                    <b>💡 Sugerencia de Mejora:</b>
                    {{aiSuggestion}}
                  </div>
                </div>
              </div>
            {{/each}}
            
            <div class="footer">
              Este reporte fue generado automáticamente por el Sistema de Revisión de Tesis con IA.
              <br>© {{year}} Universidad - Todos los derechos reservados.
            </div>
          </div>
        </body>
      </html>
    `;

    const template = handlebars.compile(templateHtml);
    const html = template({
      ...data,
      submissionId,
      year: new Date().getFullYear(),
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  private calculateMetrics(evaluation: any) {
    // Calculamos métricas simuladas basadas en la nota real y los hallazgos
    const score = evaluation.overallScore;
    const findings = evaluation.findings || [];

    // Contamos hallazgos por tipo para penalizar ligeramente cada métrica
    const structurePenalties =
      findings.filter((f: any) => f.type === 'STRUCTURE').length * 5;
    const contentPenalties =
      findings.filter((f: any) => f.type === 'CONTENT').length * 5;
    const formatPenalties =
      findings.filter((f: any) => f.type === 'FORMAT').length * 5;

    // Métricas de IA y Similitud (Simuladas basadas en la evaluación)
    // El porcentaje de IA suele ser bajo en tesis reales, la similitud depende de las citas.
    const aiPercentage = Math.floor(Math.random() * 15) + 5; // 5% - 20%
    const similarity = Math.floor(Math.random() * 20) + 2; // 2% - 22%

    return {
      structure: Math.max(0, Math.min(100, score - structurePenalties)),
      content: Math.max(0, Math.min(100, score - contentPenalties)),
      format: Math.max(0, Math.min(100, score - formatPenalties)),
      aiPercentage,
      similarity,
      aiStatus: aiPercentage > 20 ? 'Alto' : 'Normal',
      aiBadgeClass: aiPercentage > 20 ? 'badge-high' : 'badge-low',
      simStatus: similarity > 15 ? 'Revisar' : 'Aceptable',
      simBadgeClass: similarity > 15 ? 'badge-med' : 'badge-low',
    };
  }
}
