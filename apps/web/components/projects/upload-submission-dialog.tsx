"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, FileUp } from "lucide-react"

export function UploadSubmissionDialog({ 
  projectId, 
  onUploadSuccess 
}: { 
  projectId: string, 
  onUploadSuccess: () => void 
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("projectId", projectId)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const response = await fetch(`${apiUrl}/submissions/upload`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setOpen(false)
        setFile(null)
        onUploadSuccess()
      } else {
        alert("Error al subir el avance")
      }
    } catch (error) {
      console.error("Error subiendo avance", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <FileUp className="h-4 w-4" /> Subir Avance
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Avance de Tesis</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Documento de la Tesis (PDF o Word)</Label>
            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors relative">
              <input 
                id="sub-file" 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-center">
                {file ? file.name : "Selecciona el archivo de tu avance"}
              </span>
              <p className="text-xs text-muted-foreground">La IA lo analizará automáticamente contra el patrón.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !file} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar para Revisión IA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
