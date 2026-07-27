"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  Loader2
} from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    password: "",
    role: "STUDENT",
    orcid: ""
  })

  const [orcidToValidate, setOrcidToValidate] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const orcidData: Record<string, any> = {
    "0009-0002-0198-2168": { name: "Jason", lastName: "Galvez" },
    "0009-0002-8256-5779": { name: "Joel", lastName: "Florian" },
    "0000-0002-8882-9256": { name: "Juan", lastName: "Santos" }
  }

  const handleValidateOrcid = () => {
    if (!orcidToValidate) return
    setIsValidating(true)
    
    // Simular validación externa
    setTimeout(() => {
      const found = orcidData[orcidToValidate]
      if (found) {
        setFormData({
          ...formData,
          name: found.name,
          lastName: found.lastName,
          orcid: orcidToValidate
        })
      } else {
        alert("Código ORCID no reconocido. Por favor, verifique el código o ingrese los datos manualmente.")
      }
      setIsValidating(false)
    }, 1200)
  }

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${apiUrl}/users`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsDialogOpen(false)
        setFormData({ name: "", lastName: "", password: "", role: "STUDENT", orcid: "" })
        setOrcidToValidate("")
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.message || "Error al crear usuario")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Error de conexión con el servidor. Por favor, asegúrese de que el backend esté corriendo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchUsers()
      } else {
        alert("Error al eliminar usuario")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error de conexión al eliminar usuario")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los perfiles de estudiantes, revisores y coordinadores.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" /> Nuevo Usuario
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="pt-4 space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                <Label htmlFor="orcid-validate" className="text-primary font-bold">Validar con ORCID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="orcid-validate" 
                    placeholder="0000-0000-0000-0000" 
                    value={orcidToValidate}
                    onChange={(e) => setOrcidToValidate(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleValidateOrcid}
                    disabled={isValidating || !orcidToValidate}
                  >
                    {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Ingresa tu ORCID para autocompletar tus datos institucionales.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      placeholder="Ej. Juan" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Ej. Pérez" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required 
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol del Sistema</Label>
                  <select
                    id="role"
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="STUDENT">Estudiante</option>
                    <option value="REVIEWER">Revisor</option>
                    <option value="COORDINATOR">Coordinador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orcid">Código ORCID (Confirmado)</Label>
                  <Input 
                    id="orcid" 
                    placeholder="0000-0000-0000-0000" 
                    value={formData.orcid}
                    onChange={(e) => setFormData({ ...formData, orcid: e.target.value })}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No hay usuarios registrados</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  Crear primer usuario
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">ORCID</th>
                    <th className="px-6 py-4">Fecha Registro</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold uppercase tracking-wider">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.orcid ? (
                          <span className="text-xs font-mono bg-primary/5 text-primary px-2 py-1 rounded border border-primary/10">
                            {user.orcid}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No registrado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground" suppressHydrationWarning>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
