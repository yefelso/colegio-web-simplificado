"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  GraduationCap,
  Clock,
  FileText,
  User,
  School,
  Video,
  ClipboardCheck,
  QrCode,
  BarChart,
  AlertTriangle,
  X,
} from "lucide-react"

interface SidebarProps {
  open: boolean
  toggleSidebar: () => void
}

export default function Sidebar({ open, toggleSidebar }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // Cerrar el sidebar cuando se cambia de ruta en dispositivos móviles
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        toggleSidebar()
      }
    }

    window.addEventListener("popstate", handleRouteChange)
    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [toggleSidebar])

  if (!user) return null

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const adminLinks = [
    { href: "/dashboard/admin", label: "Panel Admin", icon: LayoutDashboard },
    { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/dashboard/admin/cursos", label: "Cursos", icon: BookOpen },
    { href: "/dashboard/admin/grados-secciones", label: "Grados y Secciones", icon: School },
    { href: "/dashboard/admin/grupos", label: "Grupos", icon: Users },
    { href: "/dashboard/admin/horarios", label: "Horarios", icon: Clock },
    { href: "/dashboard/admin/asignar-alumnos", label: "Asignar Alumnos", icon: GraduationCap },
    { href: "/dashboard/admin/escanear-qr", label: "Escanear QR", icon: QrCode },
  ]

  const profesorLinks = [
    { href: "/dashboard/profesor", label: "Panel Profesor", icon: LayoutDashboard },
    { href: "/dashboard/profesor/grupos", label: "Mis Grupos", icon: Users },
    { href: "/dashboard/profesor/calificaciones", label: "Calificaciones", icon: FileText },
    { href: "/dashboard/profesor/horario", label: "Mi Horario", icon: Clock },
    { href: "/dashboard/profesor/asistencias", label: "Asistencias", icon: ClipboardCheck },
  ]

  const alumnoLinks = [
    { href: "/dashboard/alumno", label: "Panel Alumno", icon: LayoutDashboard },
    { href: "/dashboard/alumno/cursos", label: "Mis Cursos", icon: BookOpen },
    { href: "/dashboard/alumno/calificaciones", label: "Calificaciones", icon: FileText },
    { href: "/dashboard/alumno/asistencias", label: "Mis Asistencias", icon: ClipboardCheck },
  ]

  const auxiliarLinks = [
    { href: "/dashboard/auxiliar", label: "Panel Auxiliar", icon: LayoutDashboard },
    { href: "/dashboard/auxiliar/escanear-qr", label: "Escanear QR", icon: QrCode },
    { href: "/dashboard/auxiliar/asistencias", label: "Asistencias", icon: ClipboardCheck },
    { href: "/dashboard/auxiliar/reportes", label: "Reportes", icon: BarChart },
    { href: "/dashboard/auxiliar/alertas", label: "Enviar Alertas", icon: AlertTriangle },
  ]

  const commonLinks = [
    { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
    { href: "/dashboard/mensajes", label: "Mensajes", icon: MessageSquare },
    { href: "/dashboard/clases", label: "Clases Virtuales", icon: Video },
    { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
    { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  ]

  const renderLinks = (links: { href: string; label: string; icon: any }[]) => {
    return links.map((link) => {
      const Icon = link.icon
      return (
        <li key={link.href}>
          <Link
            href={link.href}
            className={`flex items-center p-2 rounded-md ${
              isActive(link.href) ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            } transition-colors`}
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar()
              }
            }}
          >
            <Icon className="h-5 w-5 mr-3" />
            <span>{link.label}</span>
          </Link>
        </li>
      )
    })
  }

  // Si el sidebar está cerrado, no renderizamos nada
  if (!open) {
    return null
  }

  return (
    <>
      {/* Overlay para cerrar el sidebar */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleSidebar} aria-hidden="true"></div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r shadow-sm w-64">
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Colegio App</h1>
          <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100" aria-label="Cerrar sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center p-2 rounded-md ${
                  isActive("/dashboard") &&
                  !isActive("/dashboard/admin") &&
                  !isActive("/dashboard/profesor") &&
                  !isActive("/dashboard/alumno") &&
                  !isActive("/dashboard/auxiliar")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                } transition-colors`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar()
                  }
                }}
              >
                <LayoutDashboard className="h-5 w-5 mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>

            {user.role === "admin" && renderLinks(adminLinks)}
            {user.role === "profesor" && renderLinks(profesorLinks)}
            {user.role === "alumno" && renderLinks(alumnoLinks)}
            {user.role === "auxiliar" && renderLinks(auxiliarLinks)}

            <li className="pt-4 mt-4 border-t border-gray-200">
              <h2 className="px-3 mb-2 text-xs text-gray-500 uppercase">General</h2>
            </li>
            {renderLinks(commonLinks)}

            <li className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={logout}
                className="flex items-center w-full p-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Cerrar Sesión</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium">{user.nombre || user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
