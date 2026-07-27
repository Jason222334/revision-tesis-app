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
  const [docType, setDocType] = useState("TESIS")
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState(0) // 0: input, 1: generating, 2: success
  const [progress, setProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)

  const steps = [
    "Consultando Documento Patrón institucional...",
    "Analizando estructura de " + docType + "...",
    "Generando contenido con IA avanzada...",
    "Aplicando normas de estilo académicas...",
    "Finalizando borrador profesional..."
  ]

  const handleGenerate = async () => {
    if (!title) return
    setIsGenerating(true)
    setStep(1)
    setProgress(0)
    
    // Simulación de 10 segundos
    const duration = 10000; // 10 segundos
    const intervalTime = 100; // Actualizar cada 100ms
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.floor((currentStep / totalSteps) * 100), 99);
      setProgress(newProgress);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setProgress(100);
        setGeneratedContent(`
# ${title}
## Introducción
Este es un borrador generado automáticamente para el ${docType.toLowerCase()} titulado "${title}".
          
## Metodología
Se ha seguido una metodología descriptiva y analítica para el desarrollo de esta investigación.

## Conclusiones
El presente trabajo sienta las bases para futuras investigaciones en el área.
        `);
        setIsGenerating(false);
        setStep(2);
      }
    }, intervalTime);
  }

  const handleDownload = () => {
    console.log("Iniciando descarga simulada...", { title, docType });
    
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = { top: 25, bottom: 25, left: 30, right: 25 };
      const pageWidth = 210;
      const contentWidth = pageWidth - margin.left - margin.right;

      let y = margin.top;

      const addText = (text: string, options: { align?: "left" | "center" | "right" | "justify", isBold?: boolean, fontSize?: number, spacing?: number } = {}) => {
        doc.setFont("helvetica", options.isBold ? "bold" : "normal");
        const fSize = options.fontSize || 12;
        doc.setFontSize(fSize);

        const lines = doc.splitTextToSize(text, contentWidth);
        const currentLineHeight = (fSize * 0.3527) * 1.5;

        lines.forEach((line: string) => {
          if (options.align === "center") {
            doc.text(line, pageWidth / 2, y, { align: "center" });
          } else {
            doc.text(line, margin.left, y);
          }
          y += currentLineHeight;
        });
        y += options.spacing !== undefined ? options.spacing : 2;
      };

      // CARÁTULA SIMULADA
      addText("UNIVERSIDAD NACIONAL DE TRUJILLO", { align: "center", isBold: true, fontSize: 16, spacing: 5 });
      addText("FACULTAD DE INGENIERÍA", { align: "center", isBold: true, fontSize: 14, spacing: 40 });
      
      addText(docType, { align: "center", isBold: true, fontSize: 14, spacing: 10 });
      addText(title.toUpperCase(), { align: "center", isBold: true, fontSize: 12, spacing: 60 });
      
      addText("AUTOR: " + (session?.user?.name || "Usuario del Sistema"), { align: "center", spacing: 60 });
      
      addText("TRUJILLO - PERÚ", { align: "center", isBold: true, spacing: 5 });
      addText(new Date().getFullYear().toString(), { align: "center", isBold: true });

      doc.addPage();
      y = margin.top;
      addText("CONTENIDO PRELIMINAR DEL " + docType, { isBold: true, fontSize: 14, spacing: 10 });
      addText("Este es un borrador simulado para fines de demostración del flujo de trabajo.", { spacing: 10 });
      addText("Título: " + title);
      addText("Tipo de documento: " + docType);
      addText("Fecha de generación: " + new Date().toLocaleDateString());

      doc.save(`${docType}_${title.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generación de Documentos Académicos</h1>
        <p className="text-muted-foreground">
          Genera borradores profesionales de Tesis, Artículos o Proyectos en segundos.
        </p>
      </div>

      <div className="grid gap-6">
        {step === 0 && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Redacción Académica
              </CardTitle>
              <CardDescription>
                Selecciona el tipo de documento y el título para comenzar la generación.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-bold">Seleccionar Plantilla</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["TESIS", "ARTICULO", "PROYECTO"].map((type) => (
                      <Button
                        key={type}
                        variant={docType === type ? "default" : "outline"}
                        onClick={() => setDocType(type)}
                        className="font-bold"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university" className="text-base font-bold">Universidad</Label>
                  <select 
                    id="university"
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                    defaultValue="unt"
                  >
                    <option value="unt">Universidad Nacional de Trujillo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-bold">Título de la Investigación</Label>
                  <Input 
                    id="title" 
                    placeholder="Ej. Análisis de la ciberseguridad en infraestructuras críticas" 
                    className="text-lg py-6 border-2 focus-visible:ring-primary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!title || isGenerating} 
                className="w-full h-12 text-lg font-bold gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} 
                GENERAR {docType}
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
                  <h3 className="text-xl font-bold text-primary">Generando {docType}...</h3>
                  <p className="text-sm text-muted-foreground italic min-h-[40px]">
                    {steps[Math.min(Math.floor(progress / 20), steps.length - 1)]}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Simulando proceso de redacción avanzado
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
                  <CheckCircle2 className="h-5 w-5" /> {docType} Generado con Éxito
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-1 rounded">VISTA PREVIA DISPONIBLE</span>
              </div>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="p-6 bg-white rounded-xl shadow-inner border-2 border-green-100 flex flex-col items-center gap-2">
                    <FileText className="h-20 w-20 text-green-600" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">PDF LISTO</span>
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-black text-green-900 leading-tight">{title}</h2>
                      <p className="text-sm text-green-700 mt-1">
                        Se ha simulado la generación del documento de tipo <strong>{docType}</strong>.
                      </p>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleDownload} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-lg h-12 text-base">
                        <Download className="h-5 w-5" /> DESCARGAR {docType}
                      </Button>
                      <Button variant="outline" onClick={() => setStep(0)} className="h-12">
                        Generar otro
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
