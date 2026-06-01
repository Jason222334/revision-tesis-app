import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as mammoth from 'mammoth';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async extractText(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      if (mimetype.includes('word') || mimetype.includes('officedocument')) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }
      return buffer.toString('utf8').substring(0, 10000);
    } catch (error) {
      this.logger.error(`Error en extracción Word: ${error.message}`);
      return 'Documento académico';
    }
  }

  async analyzeTemplateMultimodal(buffer: Buffer, mimetype: string) {
    this.logger.log(
      '🚀 Google AI: Analizando estructura con Gemini 1.5 Flash...',
    );

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Eres un experto revisor académico. Analiza el documento de GUÍA DE TESIS adjunto y extrae su estructura técnica.
      RESPONDE ÚNICAMENTE EN FORMATO JSON con esta estructura exacta:
      {
        "sections": [
          { "title": "Nombre", "description": "Contenido requerido", "isRequired": true }
        ],
        "formattingRules": {
          "citationStyle": "APA/IEEE/etc",
          "language": "es"
        }
      }
    `;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimetype,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonStr = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error(`Error crítico en Gemini: ${error.message}`);
      throw error;
    }
  }

  async analyzeSubmissionMultimodal(
    submissionBuffer: Buffer,
    mimetype: string,
    templateStructure: any,
  ) {
    this.logger.log(
      '🚀 Google AI: Evaluando tesis con Gemini 1.5 Flash...',
    );

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Actúa como un revisor de tesis experto y sumamente detallista. Evalúa el avance adjunto comparándolo minuciosamente con este PATRÓN:
      ${JSON.stringify(templateStructure)}
      
      INSTRUCCIONES CRÍTICAS DE REVISIÓN:
      1. Divide tu análisis en: ESTRUCTURA (falta de secciones), CONTENIDO (calidad de redacción, objetivos, coherencia) e FORMATO (normas APA/citas).
      2. REVISIÓN BIBLIOGRÁFICA (OBLIGATORIO): Busca la sección de Referencias o Bibliografía. Verifica meticulosamente que CADA entrada cumpla estrictamente con el formato APA 7ma Edición. Identifica errores específicos en el orden de los elementos, puntuación, uso de cursivas, sangría francesa o falta de datos críticos (DOI, links, editorial).
      3. CITAS EN TEXTO: Verifica que las citas dentro del cuerpo del trabajo sigan el formato APA (Autor, Año) y que coincidan con la lista de referencias.
      4. Sé MUY ESPECÍFICO. No des feedback genérico. Indica exactamente qué entrada bibliográfica está mal y por qué.
      5. Genera al menos 5-8 hallazgos detallados si el documento es extenso.
      6. El campo "aiSummary" debe ser una lista de observaciones clave en formato de viñetas (usando caracteres de viñeta como •), no un párrafo largo.
      
      RESPONDE ÚNICAMENTE EN FORMATO JSON con esta estructura exacta:
      {
        "findings": [
          { 
            "section": "Nombre de la Sección (ej: Referencias Bibliográficas)", 
            "type": "STRUCTURE|CONTENT|FORMAT", 
            "severity": "CRITICAL|MAJOR|MINOR|SUGGESTION", 
            "description": "Explicación detallada del error de formato APA o contenido", 
            "aiSuggestion": "Instrucción paso a paso para corregirlo según la norma APA 7",
            "exampleImprovement": "Un ejemplo de cómo debería estar redactada la referencia o cita correctamente"
          }
        ],
        "overallScore": 0-100,
        "aiSummary": "• Observación 1\\n• Observación 2\\n• Observación 3"
      }
    `;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: submissionBuffer.toString('base64'),
            mimeType: mimetype,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonStr = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error(`Error en evaluación Gemini: ${error.message}`);
      throw error;
    }
  }

  async generateFullThesisDraft(
    title: string,
    templateStructure: any,
  ): Promise<string> {
    this.logger.log(
      `🚀 Google AI: Generando borrador completo de tesis: "${title}"`,
    );

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Eres un asistente de redacción académica experto. Tu tarea es redactar un borrador de tesis COMPLETO, PROFESIONAL y DETALLADO.
      
      TÍTULO DE LA TESIS: "${title}"
      ESTRUCTURA REQUERIDA (BASADA EN EL DOCUMENTO PATRÓN):
      ${JSON.stringify(templateStructure)}

      INSTRUCCIONES CRÍTICAS DE REDACCIÓN:
      1. EXTENSIÓN OBLIGATORIA: El documento debe ser extremadamente detallado, cubriendo entre 10 y 15 páginas. NO RESUMAS. Expande cada sección al máximo con bases teóricas, marco conceptual extenso y detalles metodológicos profundos.
      2. El borrador debe cubrir detalladamente:
         - CAPÍTULO I: INTRODUCCIÓN (Realidad problemática extensa, justificación detallada, objetivos precisos y antecedentes a profundidad).
         - CAPÍTULO II: MÉTODO (Tipo, diseño, población, muestra, variables, instrumentos, todos definidos con citas teóricas).
         - CAPÍTULO III: ASPECTOS ADMINISTRATIVOS.
      3. Utiliza un lenguaje formal, técnico y propio de una tesis universitaria.
      4. Desarrolla párrafos largos y analíticos. Cada subsección debe tener múltiples párrafos (mínimo 300-500 palabras por subsección).
      5. Incluye numerosas citas ficticias en formato APA 7 para dar realismo (ej: Smith, 2023; Pérez & Gómez, 2022).
      6. IMPORTANTE: Prohibido dejar espacios en blanco grandes o respuestas breves. Si la estructura tiene 10 puntos, cada punto debe tener al menos una página de desarrollo teórico o práctico.
      7. Estructura el resultado con títulos claros marcados con # o ##.

      RESPONDE ÚNICAMENTE CON EL TEXTO DE LA TESIS EN FORMATO MARKDOWN.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error(`Error en generación de tesis: ${error.message}`);
      throw error;
    }
  }
}
