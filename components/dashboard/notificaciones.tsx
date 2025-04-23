"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc } from "firebase/firestore"
import type { Notificacion } from "@/lib/models/notificacion"
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, MailOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificacionesMenu() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    if (user) {
      cargarNotificaciones()
    }
  }, [user])

  const cargarNotificaciones = async () => {
    if (!user) return

    setLoading(true)
    try {
      const notificacionesRef = collection(db, "notificaciones")
      const q = query(notificacionesRef, where("userId", "==", user.uid), orderBy("fecha", "desc"), limit(10))

      const querySnapshot = await getDocs(q)
      const notificacionesData: Notificacion[] = []

      querySnapshot.forEach((doc) => {
        notificacionesData.push({
          id: doc.id,
          ...(doc.data() as Omit<Notificacion, "id">),
        })
      })

      setNotificaciones(notificacionesData)
      setNoLeidas(notificacionesData.filter((n) => !n.leida).length)
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      await updateDoc(doc(db, "notificaciones", notificacionId), {
        leida: true,
      })

      // Actualizar el estado local
      setNotificaciones((prev) => prev.map((n) => (n.id === notificacionId ? { ...n, leida: true } : n)))

      setNoLeidas((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      // Actualizar todas las notificaciones no leídas
      const promesas = notificaciones
        .filter((n) => !n.leida && n.id)
        .map((n) => updateDoc(doc(db, "notificaciones", n.id!), { leida: true }))

      await Promise.all(promesas)

      // Actualizar el estado local
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))

      setNoLeidas(0)

      toast({
        title: "Notificaciones actualizadas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      })
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las notificaciones",
        variant: "destructive",
      })
    }
  }

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatearFecha = (fecha: any) => {
    try {
      if (!fecha) return ""

      // Convertir a Date si es Timestamp
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha)

      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return ""
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {noLeidas > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={marcarTodasComoLeidas}>
              <MailOpen className="h-3 w-3 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">No tienes notificaciones</div>
          ) : (
            <DropdownMenuGroup>
              {notificaciones.map((notificacion) => (
                <DropdownMenuItem
                  key={notificacion.id}
                  className={`flex flex-col items-start p-3 ${!notificacion.leida ? "bg-blue-50" : ""}`}
                  onClick={() => {
                    if (!notificacion.leida && notificacion.id) {
                      marcarComoLeida(notificacion.id)
                    }
                  }}
                >
                  <div className="flex w-full items-start gap-2">
                    <div className="mt-0.5">{getIcono(notificacion.tipo)}</div>
                    <div className="flex-1">
                      <div className="font-medium">{notificacion.titulo}</div>
                      <p className="text-sm text-gray-600 line-clamp-2">{notificacion.mensaje}</p>
                      <div className="mt-1 text-xs text-gray-400">{formatearFecha(notificacion.fecha)}</div>
                    </div>
                    {!notificacion.leida && <div className="ml-2 h-2 w-2 rounded-full bg-blue-600"></div>}
                  </div>

                  {notificacion.enlace && (
                    <Link
                      href={notificacion.enlace}
                      className="mt-2 text-xs text-blue-600 hover:underline self-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver detalles
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notificaciones" className="w-full text-center text-sm cursor-pointer">
            Ver todas las notificaciones
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
