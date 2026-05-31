"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  FileCode, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { signOut } from "next-auth/react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "COORDINATOR", "REVIEWER", "STUDENT"],
  },
  {
    title: "Documentos Patrón",
    href: "/templates",
    icon: FileCode,
    roles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Proyectos de Tesis",
    href: "/projects",
    icon: FileText,
    roles: ["ADMIN", "COORDINATOR", "REVIEWER", "STUDENT"],
  },
  {
    title: "Generación IA",
    href: "/generate",
    icon: Sparkles,
    roles: ["ADMIN", "COORDINATOR", "REVIEWER", "STUDENT"],
  },
  {
    title: "Usuarios",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
]

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredItems = sidebarItems.filter((item) => 
    item.roles.includes(user?.role || "")
  )

  return (
    <div 
      className={cn(
        "relative flex flex-col h-screen border-r bg-white transition-all duration-300 z-20",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-6 border-b">
        <GraduationCap className="h-8 w-8 text-primary" />
        {!isCollapsed && (
          <span className="font-bold text-lg truncate">Tesis AI</span>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          ))
        ) : (
          <div className="px-3 py-2 text-xs text-muted-foreground italic">
            Sin módulos para el rol: {user?.role || 'N/A'}
          </div>
        )}
      </nav>

      <div className="p-2 border-t mt-auto">
        {!isCollapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Usuario
            </p>
            <p className="text-sm font-medium truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {user?.role || 'Sin Rol'}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </Button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow-md hover:bg-muted transition-colors"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
      </button>
    </div>
  )
}
