"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  FileText, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { BatchUploadDialog } from "@/components/projects/batch-upload-dialog"
import { UploadSubmissionDialog } from "@/components/projects/upload-submission-dialog"
import Link from "next/link"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchProjects = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true)
    else setIsRefreshing(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${apiUrl}/projects`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este avance? Esta acción no se puede deshacer y borrará el archivo y todos los análisis relacionados.")) {
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${apiUrl}/submissions/${submissionId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchProjects(false)
      } else {
        alert("No se pudo eliminar el avance")
      }
    } catch (error) {
      console.error("Error al eliminar el avance:", error)
      alert("Error de conexión al eliminar el avance")
    }
  }

  // Polling: Si hay algún proyecto analizando, refrescar cada 5 segundos
  useEffect(() => {
    const hasActiveAnalysis = projects.some(p => 
      p.submissions?.some((s: any) => s.status === 'ANALYZING' || s.status === 'PENDING')
    )

    if (hasActiveAnalysis) {
      const interval = setInterval(() => {
        fetchProjects(false)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [projects, fetchProjects])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos de Tesis</h1>
          <p className="text-muted-foreground">
            Gestiona tus trabajos de investigación y visualiza las evaluaciones de IA.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fetchProjects(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <BatchUploadDialog />
          <CreateProjectDialog onProjectCreated={() => fetchProjects(false)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tienes proyectos registrados</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Registra tu tema de tesis para empezar a subir avances.
                </p>
                <div className="flex gap-2">
                  <BatchUploadDialog />
                  <CreateProjectDialog onProjectCreated={() => fetchProjects(false)} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project: any) => (
                <Card key={project.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                  <div className="border-l-8 border-primary h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {project.program?.name}
                          </span>
                          <span>•</span>
                          <span>{project.submissions?.length || 0} avances</span>
                        </div>
                      </div>
                      <UploadSubmissionDialog projectId={project.id} onUploadSuccess={() => fetchProjects(false)} />
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mt-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Historial de Revisiones</h4>
                        {project.submissions?.length === 0 ? (
                          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground italic">Aún no has enviado avances para este proyecto.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {project.submissions.map((sub: any) => (
                              <div key={sub.id} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "p-2.5 rounded-xl shadow-sm",
                                    sub.status === 'APPROVED' ? "bg-green-100 text-green-600" :
                                    sub.status === 'OBSERVED' ? "bg-amber-100 text-amber-600" :
                                    sub.status === 'ANALYZING' ? "bg-blue-100 text-blue-600" :
                                    "bg-gray-100 text-gray-600"
                                  )}>
                                    {sub.status === 'ANALYZING' ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                                     sub.status === 'APPROVED' ? <CheckCircle2 className="h-5 w-5" /> :
                                     <Clock className="h-5 w-5" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold">Versión {sub.version}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge variant={
                                    sub.status === 'APPROVED' ? 'default' : 
                                    sub.status === 'ANALYZING' ? 'secondary' : 
                                    'outline'
                                  }>
                                    {sub.status === 'ANALYZING' ? 'IA ANALIZANDO...' : 
                                     sub.status === 'REVIEWING' ? 'LISTO PARA REVISIÓN' : 
                                     sub.status}
                                  </Badge>
                                  
                                  {sub.status !== 'ANALYZING' && (
                                    <Link 
                                      href={`/review/${sub.id}`}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary hover:text-white border border-primary px-3 py-1.5 rounded-full transition-all"
                                    >
                                      VER REVISIÓN <Search className="h-3 w-3" />
                                    </Link>
                                  )}

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteSubmission(sub.id)}
                                    className="rounded-full gap-1 font-bold text-xs shadow-sm bg-red-600 hover:bg-red-700"
                                  >
                                    ELIMINAR <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Funciones de ayuda
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

function Badge({ children, variant = 'default', className = '' }: any) {
  const variants: any = {
    default: "bg-green-100 text-green-700 border-green-200",
    secondary: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
    outline: "bg-gray-50 text-gray-600 border-gray-200",
    destructive: "bg-red-100 text-red-700 border-red-200"
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
