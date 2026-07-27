"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Upload, Loader2 } from "lucide-react"

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  
  // Datos del formulario
  const [name, setName] = useState("")
  const [programId, setProgramId] = useState("")
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      // Cargar programas disponibles
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      fetch(`${apiUrl}/programs`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPrograms(data)
            if (data.length > 0) setProgramId(data[0].id)
          }
        })
        .catch(err => console.error("Error loading programs:", err))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name || !programId) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", name)
    formData.append("programId", programId)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const response = await fetch(`${apiUrl}/templates/upload`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setOpen(false)
        setName("")
        setFile(null)
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.message || 'No se pudo subir la plantilla'}`)
      }
    } catch (error) {
      console.error("Error subiendo plantilla", error)
      alert("Error de conexión al subir la plantilla")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Patrón
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Documento Patrón</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Plantilla</Label>
            <Input 
              id="name" 
              placeholder="Ej: Guía Tesis Ingeniería V2" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">Universidad</Label>
            <select 
              id="university"
              className="w-full border rounded-md p-2 text-sm bg-background font-medium"
              defaultValue="unt"
            >
              <option value="unt">Universidad Nacional de Trujillo</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="program">Programa Académico</Label>
            <select 
              id="program"
              className="w-full border rounded-md p-2 text-sm bg-background"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona un programa</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Documento (Word o PDF)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors relative">
              <input 
                id="file" 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              <div className="flex flex-col items-center pointer-events-none">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">
                  {file ? file.name : "Haz clic para seleccionar archivo"}
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Soportado: PDF, DOC, DOCX<br/>Máximo 50MB
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !file || !name || !programId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar y Analizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
