import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  FileText, 
  BarChart3, 
  Bell, 
  Clock, 
  ChevronRight,
  User as UserIcon
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

async function getStats() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    const res = await fetch(`${apiUrl}/stats`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error("Error fetching stats:", error)
    return null
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = session.user as any
  const stats = await getStats()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido, {user.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              {user.role}
            </span>
            <span>Sistema de Gestión de Tesis</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/api/auth/signout" 
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Cerrar Sesión
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resumen General</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Avances presentados en total</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cumplimiento IA</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats?.averageCompliance || 0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Promedio de cumplimiento estructural</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notificaciones</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tareas pendientes de atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Mock Chart Section */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle>Actividad de Revisiones (Últimos 6 Meses)</CardTitle>
          <p className="text-sm text-muted-foreground">Volumen de entregas procesadas por la IA vs Revisiones Manuales</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full flex items-end gap-2 sm:gap-6 pt-4 pb-2">
            {[
              { month: 'Ene', ai: 40, manual: 24 },
              { month: 'Feb', ai: 55, manual: 35 },
              { month: 'Mar', ai: 30, manual: 15 },
              { month: 'Abr', ai: 85, manual: 60 },
              { month: 'May', ai: 65, manual: 40 },
              { month: 'Jun', ai: 90, manual: 75 },
            ].map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-[200px] relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    IA: {data.ai} | Manual: {data.manual}
                  </div>
                  {/* AI Bar */}
                  <div 
                    className="w-full sm:w-8 bg-blue-500 rounded-t-sm transition-all duration-500 hover:brightness-110" 
                    style={{ height: `${data.ai}%` }}
                  ></div>
                  {/* Manual Bar */}
                  <div 
                    className="w-full sm:w-8 bg-slate-300 rounded-t-sm transition-all duration-500 hover:brightness-95" 
                    style={{ height: `${data.manual}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-xs text-muted-foreground">Procesadas por IA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300 rounded-sm"></div>
              <span className="text-xs text-muted-foreground">Aprobación Manual</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {(user.role === 'REVIEWER' || user.role === 'ADMIN' || user.role === 'COORDINATOR') && (
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Avances por Revisar</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Entregas que requieren tu validación manual</p>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(!stats?.recentPending || stats.recentPending.length === 0) ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50/50">
                    <p className="text-muted-foreground">No hay avances pendientes de revisión.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {stats.recentPending.map((submission: any) => (
                      <div key={submission.id} className="py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors px-2 rounded-lg group">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{submission.project.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span className="font-medium">{submission.project.student.name}</span>
                              <span>•</span>
                              <span>Versión {submission.version}</span>
                              <span>•</span>
                              <span suppressHydrationWarning>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Link 
                          href={`/review/${submission.id}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Revisar <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {user.role === 'STUDENT' && (
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle>Mis Proyectos de Tesis</CardTitle>
                <p className="text-sm text-muted-foreground">Estado de tus investigaciones activas</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50/50">
                  <p className="text-muted-foreground mb-4">Aún no tienes proyectos de tesis registrados.</p>
                  <Link href="/projects" className={buttonVariants()}>
                    Registrar Mi Tesis
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/projects" className={buttonVariants({ variant: "outline", className: "justify-start" })}>
                <FileText className="mr-2 h-4 w-4" /> Ver Proyectos
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/users" className={buttonVariants({ variant: "outline", className: "justify-start" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Gestionar Usuarios
                </Link>
              )}
              <Link href="/templates" className={buttonVariants({ variant: "outline", className: "justify-start" })}>
                <BarChart3 className="mr-2 h-4 w-4" /> Configurar Plantillas
              </Link>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg mb-2">Ayuda del Sistema</h3>
              <p className="text-sm opacity-90 mb-4">
                ¿Tienes dudas sobre cómo interpretar los resultados de la IA? Consulta nuestra guía.
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Ver Documentación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
