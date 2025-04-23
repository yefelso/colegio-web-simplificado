"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from "firebase/firestore"
import type { Notificacion } from "@/lib/models/notificacion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Info, AlertTriangle, CheckCircle, XCircle, MailOpen, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificacionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("todas")

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
      const q = query(notificacionesRef, where("userId", "==", user.uid), orderBy("fecha", "desc"))

      const querySnapshot = await getDocs(q)
      const notificacionesData: Notificacion[] = []

      querySnapshot.forEach((doc) => {
        notificacionesData.push({
          id: doc.id,
          ...(doc.data() as Omit<Notificacion, "id">),
        })
      })

      setNotificaciones(notificacionesData)
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

      toast({
        title: "Notificación actualizada",
        description: "La notificación ha sido marcada como leída",
      })
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la notificación",
        variant: "destructive",
      })
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
        return <Info className="h-5 w-5 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const formatearFecha = (fecha: any) => {
    try {
      if (!fecha) return ""

      // Convertir a Date si es Timestamp
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha)

      return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return ""
    }
  }

  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (activeTab === "todas") return true
    if (activeTab === "no-leidas") return !n.leida
    return n.tipo === activeTab
  })

  const contarNoLeidas = () => {
    return notificaciones.filter((n) => !n.leida).length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-gray-500">Revisa tus notificaciones y alertas</p>
        </div>

        {contarNoLeidas() > 0 && (
          <Button variant="outline" size="sm" onClick={marcarTodasComoLeidas} className="self-start sm:self-auto">
            <MailOpen className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-4">
          <TabsTrigger value="todas">
            Todas
            <Badge variant="secondary" className="ml-2">
              {notificaciones.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="no-leidas">
            No leídas
            <Badge variant="secondary" className="ml-2">
              {contarNoLeidas()}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="warning">Alertas</TabsTrigger>
          <TabsTrigger value="error">Errores</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "todas"
                  ? "Todas las notificaciones"
                  : activeTab === "no-leidas"
                    ? "Notificaciones no leídas"
                    : activeTab === "info"
                      ? "Notificaciones informativas"
                      : activeTab === "warning"
                        ? "Alertas"
                        : "Errores"}
              </CardTitle>
              <CardDescription>
                {activeTab === "todas"
                  ? "Todas tus notificaciones y alertas"
                  : activeTab === "no-leidas"
                    ? "Notificaciones que aún no has leído"
                    : activeTab === "info"
                      ? "Información importante del sistema"
                      : activeTab === "warning"
                        ? "Alertas que requieren tu atención"
                        : "Errores y problemas detectados"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : notificacionesFiltradas.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No hay notificaciones para mostrar</div>
              ) : (
                <div className="space-y-4">
                  {notificacionesFiltradas.map((notificacion) => (
                    <div
                      key={notificacion.id}
                      className={`rounded-lg border p-4 ${!notificacion.leida ? "bg-blue-50 border-blue-200" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5">{getIcono(notificacion.tipo)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{notificacion.titulo}</h3>
                            {!notificacion.leida && (
                              <Badge variant="secondary" className="ml-2">
                                Nueva
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-gray-600">{notificacion.mensaje}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">{formatearFecha(notificacion.fecha)}</span>

                            <div className="flex gap-2">
                              {notificacion.enlace && (
                                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                                  <Link href={notificacion.enlace}>Ver detalles</Link>
                                </Button>
                              )}

                              {!notificacion.leida && notificacion.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto text-xs"
                                  onClick={() => marcarComoLeida(notificacion.id!)}
                                >
                                  Marcar como leída
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
