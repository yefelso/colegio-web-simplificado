"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, Home, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import NotificacionesMenu from "./notificaciones"

interface DashboardHeaderProps {
  toggleSidebar: () => void
}

export default function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
  const { user } = useAuth()

  const getInitials = (name = "", surname = "") => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
  }

  const getUserDashboardLink = () => {
    if (!user) return "/dashboard"

    switch (user.role) {
      case "admin":
        return "/dashboard/admin"
      case "profesor":
        return "/dashboard/profesor"
      case "alumno":
        return "/dashboard/alumno"
      case "auxiliar":
        return "/dashboard/auxiliar"
      default:
        return "/dashboard"
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Abrir/cerrar menú"
          className="text-gray-700 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-gray-700 hover:bg-gray-100">
            <Link href="/">
              <Home className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-gray-700 hover:bg-gray-100">
            <Link href={getUserDashboardLink()}>
              <User className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Mi Panel</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificacionesMenu />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(user?.nombre, user?.apellidos)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/perfil">Mi Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracion">Configuración</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
