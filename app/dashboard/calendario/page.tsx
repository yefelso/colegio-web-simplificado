"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Evento {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  creadorId: string
  creadorNombre: string
  tipo: "general" | "curso" | "examen"
  cursoId?: string
  cursoNombre?: string
}

export default function CalendarioPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)

  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "general",
    cursoId: "",
  })

  const [cursos, setCursos] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    if (user) {
      cargarEventos()
      if (user.role === "admin" || user.role === "profesor") {
        cargarCursos()
      }
    }
  }, [user])

  const cargarEventos = async () => {
    if (!user) return

    setLoading(true)
    try {
      let eventosQuery
      let cursosIds: string[] = []

      if (user.role === "admin") {
        // Los administradores ven todos los eventos
        eventosQuery = collection(db, "eventos")
      } else if (user.role === "profesor") {
        // Los profesores ven eventos generales y los de sus cursos
        const gruposRef = collection(db, "grupos")
        const gruposQuery = query(gruposRef, where("profesorId", "==", user.uid))
        const gruposSnapshot = await getDocs(gruposQuery)

        cursosIds = gruposSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            return data.cursoId || ""
          })
          .filter((id) => id !== "")

        if (cursosIds.length > 0) {
          eventosQuery = query(collection(db, "eventos"), where("tipo", "in", ["general", "curso"]))
        } else {
          eventosQuery = query(collection(db, "eventos"), where("tipo", "==", "general"))
        }
      } else {
        // Los alumnos ven eventos generales y los de sus cursos
        const asignacionesRef = collection(db, "asignaciones")
        const asignacionesQuery = query(asignacionesRef, where("alumnoId", "==", user.uid))
        const asignacionesSnapshot = await getDocs(asignacionesQuery)

        const gruposIds = asignacionesSnapshot.docs.map((doc) => doc.data().grupoId)

        if (gruposIds.length > 0) {
          // Obtener los cursos de los grupos
          const gruposPromises = gruposIds.map(async (grupoId) => {
            try {
              const grupoDocRef = doc(db, "grupos", grupoId)
              const grupoDocSnap = await getDoc(grupoDocRef)
              return grupoDocSnap.exists() ? grupoDocSnap.data().cursoId : null
            } catch (error) {
              console.error(`Error al obtener grupo ${grupoId}:`, error)
              return null
            }
          })

          cursosIds = (await Promise.all(gruposPromises)).filter(Boolean) as string[]

          if (cursosIds.length > 0) {
            eventosQuery = query(collection(db, "eventos"), where("tipo", "in", ["general", "curso"]))
          } else {
            eventosQuery = query(collection(db, "eventos"), where("tipo", "==", "general"))
          }
        } else {
          eventosQuery = query(collection(db, "eventos"), where("tipo", "==", "general"))
        }
      }

      const eventosSnapshot = await getDocs(eventosQuery)

      const eventosData = await Promise.all(
        eventosSnapshot.docs.map(async (doc) => {
          const data = doc.data()

          // Filtrar eventos de curso que no pertenecen al usuario
          if (data.tipo === "curso" && data.cursoId && user.role !== "admin") {
            if (!cursosIds.includes(data.cursoId)) {
              return null
            }
          }

          let cursoNombre = undefined

          if (data.cursoId) {
            try {
              const cursoDocRef = doc(db, "cursos", data.cursoId)
              const cursoDocSnap = await getDoc(cursoDocRef)
              if (cursoDocSnap.exists()) {
                cursoNombre = cursoDocSnap.data().nombre
              }
            } catch (error) {
              console.error(`Error al obtener curso ${data.cursoId}:`, error)
            }
          }

          return {
            id: doc.id,
            ...data,
            cursoNombre,
          } as Evento
        }),
      )

      setEventos(eventosData.filter(Boolean) as Evento[])
    } catch (error) {
      console.error("Error al cargar eventos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos del calendario.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarCursos = async () => {
    try {
      let cursosData = []

      if (user?.role === "admin") {
        // Los administradores ven todos los cursos
        const cursosSnapshot = await getDocs(collection(db, "cursos"))
        cursosData = cursosSnapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre,
        }))
      } else if (user?.role === "profesor") {
        // Los profesores ven solo sus cursos asignados
        const gruposRef = collection(db, "grupos")
        const gruposQuery = query(gruposRef, where("profesorId", "==", user.uid))
        const gruposSnapshot = await getDocs(gruposQuery)

        const cursosIds = gruposSnapshot.docs.map((doc) => doc.data().cursoId)
        const cursosUnicos = [...new Set(cursosIds)]

        const cursosPromises = cursosUnicos.map(async (cursoId) => {
          try {
            const cursoDocRef = doc(db, "cursos", cursoId)
            const cursoDocSnap = await getDoc(cursoDocRef)
            return cursoDocSnap.exists()
              ? {
                  id: cursoDocSnap.id,
                  nombre: cursoDocSnap.data().nombre,
                }
              : null
          } catch (error) {
            console.error(`Error al obtener curso ${cursoId}:`, error)
            return null
          }
        })

        cursosData = (await Promise.all(cursosPromises)).filter(Boolean)
      }

      setCursos(cursosData)
    } catch (error) {
      console.error("Error al cargar cursos:", error)
    }
  }

  // El resto del código se mantiene igual
  const handleChangeEvento = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNuevoEvento((prev) => ({ ...prev, [name]: value }))
  }

  const crearEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!nuevoEvento.titulo.trim()) {
      toast({
        title: "Error",
        description: "El título del evento es obligatorio.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "eventos"), {
        titulo: nuevoEvento.titulo,
        descripcion: nuevoEvento.descripcion,
        fecha: nuevoEvento.fecha,
        tipo: nuevoEvento.tipo,
        cursoId: nuevoEvento.tipo === "curso" ? nuevoEvento.cursoId : "",
        creadorId: user.uid,
        creadorNombre: `${user.nombre} ${user.apellidos}`,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Evento creado",
        description: "El evento ha sido creado correctamente.",
      })

      setNuevoEvento({
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        tipo: "general",
        cursoId: "",
      })

      setDialogOpen(false)
      cargarEventos()
    } catch (error) {
      console.error("Error al crear evento:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el evento. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarEvento = async (id: string) => {
    if (!user) return

    if (confirm("¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        await deleteDoc(doc(db, "eventos", id))

        toast({
          title: "Evento eliminado",
          description: "El evento ha sido eliminado correctamente.",
        })

        cargarEventos()
      } catch (error) {
        console.error("Error al eliminar evento:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el evento. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const eventosDelDia = date
    ? eventos.filter((evento) => {
        const fechaEvento = new Date(evento.fecha)
        return (
          fechaEvento.getDate() === date.getDate() &&
          fechaEvento.getMonth() === date.getMonth() &&
          fechaEvento.getFullYear() === date.getFullYear()
        )
      })
    : []

  const puedeCrearEventos = user?.role === "admin" || user?.role === "profesor"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario Escolar</h1>
          <p className="text-gray-500">Consulta y gestiona los eventos y actividades del colegio.</p>
        </div>
        {puedeCrearEventos && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={crearEvento} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input id="titulo" name="titulo" value={nuevoEvento.titulo} onChange={handleChangeEvento} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    className="w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    value={nuevoEvento.descripcion}
                    onChange={handleChangeEvento}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={nuevoEvento.fecha}
                    onChange={handleChangeEvento}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Evento</Label>
                  <select
                    id="tipo"
                    name="tipo"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={nuevoEvento.tipo}
                    onChange={handleChangeEvento}
                    required
                  >
                    <option value="general">General</option>
                    <option value="curso">Curso Específico</option>
                    <option value="examen">Examen</option>
                  </select>
                </div>
                {nuevoEvento.tipo === "curso" && (
                  <div className="space-y-2">
                    <Label htmlFor="cursoId">Curso</Label>
                    <select
                      id="cursoId"
                      name="cursoId"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={nuevoEvento.cursoId}
                      onChange={handleChangeEvento}
                      required={nuevoEvento.tipo === "curso"}
                    >
                      <option value="">Seleccionar Curso</option>
                      {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Evento"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => date < new Date("1900-01-01")}
              modifiers={{
                event: eventos.map((evento) => new Date(evento.fecha)),
              }}
              modifiersClassNames={{
                event: "bg-blue-100 text-blue-900 font-bold",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Eventos del {date?.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : eventosDelDia.length === 0 ? (
              <div className="text-center py-6">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay eventos para este día</h3>
                <p className="text-gray-500">No hay eventos programados para la fecha seleccionada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {eventosDelDia.map((evento) => (
                  <div key={evento.id} className="flex justify-between items-start p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">{evento.titulo}</h4>
                      <p className="text-sm text-gray-500 mt-1">{evento.descripcion}</p>
                      <div className="flex items-center mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            evento.tipo === "general"
                              ? "bg-blue-100 text-blue-800"
                              : evento.tipo === "curso"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {evento.tipo === "general"
                            ? "General"
                            : evento.tipo === "curso"
                              ? `Curso: ${evento.cursoNombre}`
                              : "Examen"}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">Creado por: {evento.creadorNombre}</span>
                      </div>
                    </div>
                    {(user?.role === "admin" || (user?.role === "profesor" && evento.creadorId === user.uid)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarEvento(evento.id)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
