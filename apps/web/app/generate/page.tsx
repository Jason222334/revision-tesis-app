"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Download, 
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { jsPDF } from "jspdf"
import { useSession } from "next-auth/react"
import { useState } from "react"

export default function GeneratePage() {
  const { data: session } = useSession()
  const [title, setTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState(0) // 0: input, 1: generating, 2: success
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)

  const steps = [
    "Consultando Documento Patrón institucional...",
    "Generando Capítulos I, II y III con IA avanzada...",
    "Redactando Marco Metodológico detallado...",
    "Aplicando normas de estilo académicas...",
    "Finalizando borrador de 10+ páginas..."
  ]

  const handleGenerate = async () => {
    if (!title) return
    setIsGenerating(true)
    setStep(1)
    setProgress(15)
    
    try {
      console.log("Enviando petición a:", `${process.env.NEXT_PUBLIC_API_URL}/generated-thesis`);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generated-thesis`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ title }),
      })
      
      console.log("Respuesta recibida:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Error en el servidor" }));
        throw new Error(errorData.message || `Error ${res.status}`);
      }
      
      const data = await res.json()
      console.log("Contenido recibido (primeros 100 caracteres):", data.content?.substring(0, 100));
      
      if (!data.content) {
        throw new Error("La IA no devolvió contenido.");
      }

      setProgress(100);
      setGeneratedContent(data.content);
      setIsGenerating(false);
      setStep(2);

    } catch (error: any) {
      console.error("Error completo en generación:", error);
      alert(`Error al generar: ${error.message || "Problema de conexión"}`);
      setStep(0);
      setIsGenerating(false);
    }
  }

  const handleDownload = () => {
    console.log("Iniciando descarga...", { hasContent: !!generatedContent });
    if (!generatedContent) {
      alert("No hay contenido generado para descargar.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = { top: 25, bottom: 25, left: 30, right: 25 };
      const pageWidth = 210;
      const contentWidth = pageWidth - margin.left - margin.right;
      const baseLineHeight = 7; // Aproximadamente 1.5 para fuente 12

      let y = margin.top;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > 297 - margin.bottom) {
          doc.addPage();
          y = margin.top;
          return true;
        }
        return false;
      };

      const addText = (text: string, options: { align?: "left" | "center" | "right" | "justify", isBold?: boolean, fontSize?: number, spacing?: number } = {}) => {
        doc.setFont("helvetica", options.isBold ? "bold" : "normal");
        const fSize = options.fontSize || 12;
        doc.setFontSize(fSize);

        const lines = doc.splitTextToSize(text, contentWidth);
        const currentLineHeight = (fSize * 0.3527) * 1.5; // fSize en mm * 1.5

        lines.forEach((line: string) => {
          checkPageBreak(currentLineHeight);
          if (options.align === "center") {
            doc.text(line, pageWidth / 2, y, { align: "center" });
          } else {
            doc.text(line, margin.left, y);
          }
          y += currentLineHeight;
        });
        y += options.spacing !== undefined ? options.spacing : 2;
      };

      // 1. CARÁTULA
      addText("UNIVERSIDAD NACIONAL DE TRUJILLO", { align: "center", isBold: true, fontSize: 16, spacing: 5 });
      addText("FACULTAD DE INGENIERÍA", { align: "center", isBold: true, fontSize: 14, spacing: 40 });
      
      addText("PROYECTO DE TESIS", { align: "center", isBold: true, fontSize: 14, spacing: 10 });
      addText(title.toUpperCase(), { align: "center", isBold: true, fontSize: 12, spacing: 60 });
      
      addText("AUTOR: " + (session?.user?.name || "__________________"), { align: "center", spacing: 60 });
      
      addText("TRUJILLO - PERÚ", { align: "center", isBold: true, spacing: 5 });
      addText(new Date().getFullYear().toString(), { align: "center", isBold: true });

      doc.addPage();
      y = margin.top;

      // 2. CONTENIDO GENERADO POR IA
      // Procesar línea por línea para detectar títulos de markdown
      const sourceLines = generatedContent.split('\n');
      
      sourceLines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
          y += 4; // Espacio entre párrafos
          return;
        }

        let isBold = false;
        let fontSize = 12;
        let cleanLine = trimmed;

        if (trimmed.startsWith('# ')) {
          isBold = true;
          fontSize = 16;
          cleanLine = trimmed.replace('# ', '');
          y += 5;
        } else if (trimmed.startsWith('## ')) {
          isBold = true;
          fontSize = 14;
          cleanLine = trimmed.replace('## ', '');
          y += 3;
        } else if (trimmed.startsWith('### ')) {
          isBold = true;
          fontSize = 12;
          cleanLine = trimmed.replace('### ', '');
        } else {
          // Limpiar negritas de markdown en texto normal
          cleanLine = trimmed.replace(/\*\*/g, '');
        }

        addText(cleanLine, { isBold, fontSize });
      });

      // Numeración de páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(i.toString(), 210 - margin.right, 297 - 15, { align: "right" });
      }

      console.log("Guardando PDF...");
      doc.save(`Tesis_Completa_${title.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generación de Tesis Avanzada</h1>
        <p className="text-muted-foreground">
          Genera un borrador completo de 10+ páginas basado estrictamente en el Documento Patrón institucional.
        </p>
      </div>

      <div className="grid gap-6">
        {step === 0 && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Redacción de Tesis Profesional
              </CardTitle>
              <CardDescription>
                La IA utilizará la estructura del documento patrón subido para redactar los capítulos I, II y III.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-bold">Título de la Investigación</Label>
                <Input 
                  id="title" 
                  placeholder="Ej. Análisis de la ciberseguridad en infraestructuras críticas del Perú" 
                  className="text-lg py-6 border-2 focus-visible:ring-primary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Garantía de Calidad Académica:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700 list-disc list-inside">
                  <li>Basado en tu Guía de Tesis activa</li>
                  <li>Extensión mínima de 10-15 páginas</li>
                  <li>Redacción académica profesional</li>
                  <li>Marco Metodológico completo</li>
                  <li>Citas referenciales incluidas</li>
                  <li>Borrador 100% original</li>
                </ul>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!title || isGenerating} 
                className="w-full h-12 text-lg font-bold gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} 
                GENERAR BORRADOR COMPLETO
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="py-16 border-2 border-dashed border-primary/50">
            <CardContent className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-primary/20 animate-pulse flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary/40" />
                </div>
              </div>
              <div className="space-y-4 max-w-md w-full px-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-primary">Redactando Tesis Académica...</h3>
                  <p className="text-sm text-muted-foreground italic min-h-[40px]">
                    {steps[Math.min(Math.floor(progress / 20), steps.length - 1)]}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-primary h-full transition-all duration-700 ease-in-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Procesando contenido extenso vía Gemini 2.5 Flash
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <Card className="border-2 border-green-500 bg-green-50 shadow-xl overflow-hidden">
              <div className="bg-green-500 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
                  <CheckCircle2 className="h-5 w-5" /> Borrador Académico Finalizado
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-1 rounded">CALIDAD PROFESIONAL</span>
              </div>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="p-6 bg-white rounded-xl shadow-inner border-2 border-green-100 flex flex-col items-center gap-2">
                    <FileText className="h-20 w-20 text-green-600" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">PDF GENERADO</span>
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-black text-green-900 leading-tight">{title}</h2>
                      <p className="text-sm text-green-700 mt-1">
                        Se ha redactado un documento extenso siguiendo estrictamente la estructura patronal.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className="bg-white/80 border border-green-200 px-3 py-1 rounded-full text-xs font-medium text-green-800">10+ Páginas</span>
                      <span className="bg-white/80 border border-green-200 px-3 py-1 rounded-full text-xs font-medium text-green-800">Marco Metodológico</span>
                      <span className="bg-white/80 border border-green-200 px-3 py-1 rounded-full text-xs font-medium text-green-800">APA 7th Edition</span>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleDownload} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-lg h-12 text-base">
                        <Download className="h-5 w-5" /> DESCARGAR TESIS COMPLETA
                      </Button>
                      <Button variant="outline" onClick={() => setStep(0)} className="h-12">
                        Redactar otra
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
