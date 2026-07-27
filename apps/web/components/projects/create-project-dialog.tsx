"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Plus, Loader2 } from "lucide-react"

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated: () => void }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  
  const [title, setTitle] = useState("")
  const [programId, setProgramId] = useState("")

  useEffect(() => {
    if (open) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      fetch(`${apiUrl}/programs`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPrograms(data)
            if (data.length > 0) setProgramId(data[0].id)
          }
        })
        .catch(err => console.error("Error cargando programas", err))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const response = await fetch(`${apiUrl}/projects`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ title, programId }),
      })

      if (response.ok) {
        setOpen(false)
        setTitle("")
        onProjectCreated()
      }
    } catch (error) {
      console.error("Error creando proyecto", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Proyecto
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Proyecto de Tesis</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Tesis</Label>
            <Input 
              id="title" 
              placeholder="Ej: Análisis del impacto de la IA en la educación primaria" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
          <DialogFooter>
            <Button type="submit" disabled={loading || !title || !programId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
