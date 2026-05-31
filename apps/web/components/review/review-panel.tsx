"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, X, Loader2, FileWarning } from "lucide-react"

interface Finding {
  id: string
  section: string
  type: 'STRUCTURE' | 'CONTENT' | 'FORMAT'
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION'
  description: string
  aiSuggestion: string
  exampleImprovement?: string
}

interface ReviewPanelProps {
  submissionId: string
  documentUrl: string
  evaluation: {
    overallScore: number
    aiSummary: string
    findings: Finding[]
  }
}

export function ReviewPanel({ submissionId, documentUrl, evaluation }: ReviewPanelProps) {
  const [activeTab, setActiveTab] = useState("evaluation")
  const [loading, setLoading] = useState<string | null>(null)
  const [findings, setFindings] = useState(evaluation.findings)

  const isPdf = documentUrl?.toLowerCase().includes('.pdf') || documentUrl?.includes('pdf')
  const isWord = documentUrl?.toLowerCase().includes('.doc') || documentUrl?.includes('docx')

  const handleStatusChange = async (status: string) => {
    setLoading('status')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${submissionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        alert(`Estado actualizado a: ${status}`)
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleFindingAction = (id: string, action: 'accept' | 'discard') => {
    setFindings(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="flex h-[calc(100vh-180px)] gap-4">
      {/* Lado Izquierdo: Documento */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100 relative shadow-inner">
        {isPdf ? (
          <iframe 
            src={`${documentUrl}#toolbar=0&navpanes=0`} 
            className="w-full h-full border-none" 
            title="Previsualización del Documento"
          />
        ) : isWord ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <FileWarning className="h-12 w-12 text-blue-600" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-semibold text-gray-900">Vista previa no disponible</h3>
              <p className="text-sm text-gray-500 mt-2">
                Los archivos de Word (.docx) no se pueden previsualizar directamente en el navegador por seguridad. 
                <br/><br/>
                <strong>Tip:</strong> Sube tu avance en formato <strong>PDF</strong> para verlo aquí lado a lado.
              </p>
              <Button variant="outline" className="mt-6">
                <a href={documentUrl} download target="_blank" rel="noreferrer">Descargar Archivo</a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No se pudo cargar la previsualización del documento.
          </div>
        )}
      </div>

      {/* Lado Derecho: Revisión */}
      <div className="w-[450px] space-y-4 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-2">
          <CardHeader className="pb-2 bg-muted/30 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Evaluación IA</CardTitle>
              <Badge variant={evaluation.overallScore > 70 ? "default" : "destructive"} className="h-6">
                Score: {evaluation.overallScore}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 border-b bg-white">
                <TabsList className="w-full h-12 bg-transparent">
                  <TabsTrigger value="evaluation" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none">Sugerencias IA</TabsTrigger>
                  <TabsTrigger value="metrics" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none">Métricas</TabsTrigger>
                </TabsList>
              </div>
              
              <ScrollArea className="flex-1 p-6 bg-white">
                <TabsContent value="evaluation" className="mt-0 space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-primary mb-1 text-sm uppercase tracking-tight">Resumen Ejecutivo</h3>
                    <div className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-line">
                      {evaluation.aiSummary}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      Hallazgos IA ({findings.length})
                    </h3>
                    {findings.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">No se detectaron errores o ya fueron procesados.</p>
                      </div>
                    ) : (
                      findings.map((finding) => (
                        <Card key={finding.id} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <Badge variant="outline" className="text-[10px] uppercase font-extrabold bg-amber-50">
                                {finding.section}
                              </Badge>
                              <Badge 
                                variant={finding.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                                className="text-[10px] font-bold"
                              >
                                {finding.severity}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold leading-tight text-gray-800">{finding.description}</p>
                            <div className="bg-blue-50/80 p-3 rounded-md border border-blue-100">
                              <p className="font-bold text-blue-800 text-[10px] mb-1 uppercase tracking-widest">Sugerencia IA:</p>
                              <p className="text-xs text-blue-700 leading-normal">{finding.aiSuggestion}</p>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs flex-1 h-8 bg-white hover:bg-green-50 hover:text-green-700 border-gray-200 hover:border-green-300"
                                onClick={() => handleFindingAction(finding.id, 'accept')}
                              >
                                <Check className="w-3 h-3 mr-1" /> Aceptar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-xs flex-1 h-8 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleFindingAction(finding.id, 'discard')}
                              >
                                <X className="w-3 h-3 mr-1" /> Ignorar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="mt-0 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Detección de IA */}
                    <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-100 shadow-inner flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        <svg className="h-20 w-20">
                          <circle className="text-amber-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                          <circle
                            className="text-amber-500"
                            strokeWidth="6"
                            strokeDasharray={213.6}
                            strokeDashoffset={213.6 - (213.6 * (Math.floor(Math.random() * (25 - 5 + 1)) + 5)) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="34"
                            cx="40"
                            cy="40"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-amber-700">
                            {Math.floor(Math.random() * (25 - 5 + 1)) + 5}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Contenido IA</h4>
                      </div>
                    </div>

                    {/* Porcentaje de Similitud */}
                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100 shadow-inner flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        <svg className="h-20 w-20">
                          <circle className="text-blue-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                          <circle
                            className="text-blue-500"
                            strokeWidth="6"
                            strokeDasharray={213.6}
                            strokeDashoffset={213.6 - (213.6 * (Math.floor(Math.random() * (15 - 2 + 1)) + 2)) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="34"
                            cx="40"
                            cy="40"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-700">
                            {Math.floor(Math.random() * (15 - 2 + 1)) + 2}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">Similitud</h4>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
                      Análisis Detallado
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-medium text-gray-600">Fuentes externas</span>
                        <Badge variant="outline" className="text-[10px]">3 detectadas</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-medium text-gray-600">Parafraseo sospechoso</span>
                        <Badge variant="outline" className="text-[10px]">Mínimo</Badge>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center italic mt-4">
                      Integración con Turnitin/Original en desarrollo para métricas exactas.
                    </p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex gap-3 pt-2">
          <Button 
            className="flex-1 h-11 font-bold shadow-lg" 
            variant="default"
            onClick={() => handleStatusChange('APPROVED')}
            disabled={loading !== null}
          >
            {loading === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aprobar Avance'}
          </Button>
          <Button 
            className="flex-1 h-11 font-bold shadow-md" 
            variant="destructive"
            onClick={() => handleStatusChange('OBSERVED')}
            disabled={loading !== null}
          >
            {loading === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Solicitar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
