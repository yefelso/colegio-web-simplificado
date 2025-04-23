"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { Send, ArrowLeft, FileText, Download } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Mensaje {
  id: string
  usuarioId: string
  salaId: string
  contenido: string
  fecha: any
  usuarioNombre?: string
  usuarioRole?: string
}

interface Participante {
  id: string
  nombre: string
  apellidos: string
  email: string
  role: string
  conectado?: boolean
}

interface Clase {
  id: string
  salaId: string
  grupoId: string
  profesorId: string
  fechaInicio: string
  fechaFin: string | null
  estado: "activa" | "finalizada" | "programada"
  titulo?: string
  descripcion?: string
}

interface Grupo {
  id: string
  gradoId: string
  seccionId: string
  cursoId: string
  profesorId: string
  grado?: {
    nombre: string
  }
  seccion?: {
    nombre: string
  }
  curso?: {
    nombre: string
  }
  profesor?: {
    nombre: string
    apellidos: string
  }
}

export default function SalaAlumnoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const salaId = params.salaId as string

  const [loading, setLoading] = useState(false)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [clase, setClase] = useState<Clase | null>(null)
  const [grupo, setGrupo] = useState<Grupo | null>(null)

  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<() => void>()

  useEffect(() => {
    if (user && user.role !== "alumno") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatosSala()
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [user, router, salaId])

  useEffect(() => {
    scrollToBottom()
  }, [mensajes])

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const cargarDatosSala = async () => {
    if (!user || !salaId) return

    setLoading(true)
    try {
      // Obtener información de la sala
      const salaDoc = await getDoc(doc(db, "salas", salaId))

      if (!salaDoc.exists()) {
        toast({
          title: "Error",
          description: "La sala virtual no existe.",
          variant: "destructive",
        })
        router.push("/dashboard/alumno/cursos")
        return
      }

      const salaData = salaDoc.data()

      // Obtener información del grupo
      const grupoDoc = await getDoc(doc(db, "grupos", salaData.grupoId))

      if (!grupoDoc.exists()) {
        toast({
          title: "Error",
          description: "El grupo asociado a esta sala no existe.",
          variant: "destructive",
        })
        router.push("/dashboard/alumno/cursos")
        return
      }

      const grupoData = grupoDoc.data()

      // Verificar que el alumno pertenece al grupo
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(
        asignacionesRef,
        where("alumnoId", "==", user.uid),
        where("grupoId", "==", grupoData.grupoId),
      )

      const asignacionesSnapshot = await getDocs(asignacionesQuery)

      if (asignacionesSnapshot.empty) {
        toast({
          title: "Error",
          description: "No tienes acceso a esta sala virtual.",
          variant: "destructive",
        })
        router.push("/dashboard/alumno/cursos")
        return
      }

      // Obtener información adicional del grupo
      const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
      const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
      const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))
      const profesorDoc = await getDoc(doc(db, "users", grupoData.profesorId))

      setGrupo({
        id: grupoDoc.id,
        ...grupoData,
        grado: gradoDoc.exists() ? gradoDoc.data() : undefined,
        seccion: seccionDoc.exists() ? seccionDoc.data() : undefined,
        curso: cursoDoc.exists() ? cursoDoc.data() : undefined,
        profesor: profesorDoc.exists()
          ? {
              nombre: profesorDoc.data().nombre,
              apellidos: profesorDoc.data().apellidos,
            }
          : undefined,
      })

      // Obtener clase activa
      const clasesQuery = query(
        collection(db, "clases"),
        where("salaId", "==", salaId),
        where("estado", "==", "activa"),
      )

      const clasesSnapshot = await getDocs(clasesQuery)

      if (clasesSnapshot.empty) {
        toast({
          title: "Error",
          description: "No hay una clase activa en este momento.",
          variant: "destructive",
        })
        router.push("/dashboard/alumno/cursos")
        return
      }

      setClase({
        id: clasesSnapshot.docs[0].id,
        ...clasesSnapshot.docs[0].data(),
      } as Clase)

      // Cargar participantes
      cargarParticipantes(grupoDoc.id)

      // Cargar mensajes de la sala
      cargarMensajes()
    } catch (error) {
      console.error("Error al cargar datos de la sala:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la sala virtual.",
        variant: "destructive",
      })
      router.push("/dashboard/alumno/cursos")
    } finally {
      setLoading(false)
    }
  }

  const cargarParticipantes = async (grupoId: string) => {
    try {
      // Obtener profesor del grupo
      const grupoDoc = await getDoc(doc(db, "grupos", grupoId))

      if (!grupoDoc.exists()) return

      const grupoData = grupoDoc.data()
      const profesorDoc = await getDoc(doc(db, "users", grupoData.profesorId))

      let participantesData: Participante[] = []

      if (profesorDoc.exists()) {
        const profesorData = profesorDoc.data()
        participantesData.push({
          id: profesorDoc.id,
          nombre: profesorData.nombre,
          apellidos: profesorData.apellidos,
          email: profesorData.email,
          role: "profesor",
          conectado: true, // Asumimos que el profesor está conectado
        })
      }

      // Obtener asignaciones del grupo
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(asignacionesRef, where("grupoId", "==", grupoId))
      const asignacionesSnapshot = await getDocs(asignacionesQuery)

      if (!asignacionesSnapshot.empty) {
        const alumnosIds = asignacionesSnapshot.docs.map((doc) => doc.data().alumnoId)

        // Obtener información de cada alumno
        const alumnosPromises = alumnosIds.map(async (alumnoId) => {
          const alumnoDoc = await getDoc(doc(db, "users", alumnoId))

          if (!alumnoDoc.exists()) return null

          const alumnoData = alumnoDoc.data()

          return {
            id: alumnoDoc.id,
            nombre: alumnoData.nombre,
            apellidos: alumnoData.apellidos,
            email: alumnoData.email,
            role: "alumno",
            conectado: alumnoId === user?.uid ? true : Math.random() > 0.5, // Simulación de conexión
          } as Participante
        })

        const alumnosData = (await Promise.all(alumnosPromises)).filter(Boolean) as Participante[]

        participantesData = [...participantesData, ...alumnosData]
      }

      // Ordenar: primero profesor, luego alumnos por apellido
      participantesData.sort((a, b) => {
        if (a.role === "profesor" && b.role !== "profesor") return -1
        if (a.role !== "profesor" && b.role === "profesor") return 1
        return a.apellidos.localeCompare(b.apellidos)
      })

      setParticipantes(participantesData)
    } catch (error) {
      console.error("Error al cargar participantes:", error)
    }
  }

  const cargarMensajes = () => {
    if (!user || !salaId) return

    // Desuscribirse de la suscripción anterior si existe
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    try {
      const mensajesQuery = query(
        collection(db, "mensajesSala"),
        where("salaId", "==", salaId),
        orderBy("fecha", "asc"),
      )

      // Usar onSnapshot para recibir actualizaciones en tiempo real
      const unsubscribe = onSnapshot(mensajesQuery, async (snapshot) => {
        const mensajesData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data()

            // Obtener información del usuario
            const usuarioDoc = await getDoc(doc(db, "users", data.usuarioId))

            return {
              id: doc.id,
              ...data,
              fecha: data.fecha,
              usuarioNombre: usuarioDoc.exists()
                ? `${usuarioDoc.data().nombre} ${usuarioDoc.data().apellidos}`
                : "Usuario desconocido",
              usuarioRole: usuarioDoc.exists() ? usuarioDoc.data().role : null,
            } as Mensaje
          }),
        )

        setMensajes(mensajesData)
      })

      unsubscribeRef.current = unsubscribe
    } catch (error) {
      console.error("Error al cargar mensajes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes de la sala.",
        variant: "destructive",
      })
    }
  }

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !salaId || !nuevoMensaje.trim()) return

    setEnviandoMensaje(true)
    try {
      await addDoc(collection(db, "mensajesSala"), {
        usuarioId: user.uid,
        salaId,
        contenido: nuevoMensaje,
        fecha: serverTimestamp(),
      })

      setNuevoMensaje("")
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setEnviandoMensaje(false)
    }
  }

  const formatearFecha = (timestamp: any) => {
    if (!timestamp) return ""

    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

    return fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (!user || user.role !== "alumno") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.push("/dashboard/alumno/cursos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Cursos
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clase Virtual</h1>
          {grupo && (
            <p className="text-gray-500">
              {grupo.curso?.nombre} - {grupo.grado?.nombre} "{grupo.seccion?.nombre}"
              {grupo.profesor && ` - Prof. ${grupo.profesor.nombre} ${grupo.profesor.apellidos}`}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Chat de la Clase</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-2 space-y-4 min-h-[400px] max-h-[500px]">
                  {mensajes.length === 0 ? (
                    <div className="text-center py-6">
                      <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-sm font-medium mb-2">No hay mensajes</h3>
                      <p className="text-xs text-gray-500">Sé el primero en enviar un mensaje.</p>
                    </div>
                  ) : (
                    mensajes.map((mensaje) => (
                      <div
                        key={mensaje.id}
                        className={`flex ${mensaje.usuarioId === user.uid ? "justify-end" : "justify-start"}`}
                      >
                        {mensaje.usuarioId !== user.uid && (
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{getInitials(mensaje.usuarioNombre || "")}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            mensaje.usuarioId === user.uid
                              ? "bg-blue-500 text-white"
                              : mensaje.usuarioRole === "profesor"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {mensaje.usuarioId !== user.uid && (
                            <p className="text-xs font-medium mb-1">
                              {mensaje.usuarioNombre}
                              {mensaje.usuarioRole === "profesor" && <span className="ml-1 text-xs">(Profesor)</span>}
                            </p>
                          )}
                          <p className="text-sm">{mensaje.contenido}</p>
                          <p className="text-xs mt-1 opacity-70 text-right">{formatearFecha(mensaje.fecha)}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={mensajesEndRef} />
                </div>

                <form onSubmit={enviarMensaje} className="mt-4 flex">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    disabled={enviandoMensaje}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!nuevoMensaje.trim() || enviandoMensaje} className="ml-2">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="participantes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="participantes">Participantes</TabsTrigger>
                  <TabsTrigger value="materiales">Materiales</TabsTrigger>
                </TabsList>

                <TabsContent value="participantes" className="mt-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {participantes.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Cargando participantes...</p>
                      </div>
                    ) : (
                      participantes.map((participante) => (
                        <div
                          key={participante.id}
                          className={`flex items-center p-2 rounded-md ${
                            participante.role === "profesor" ? "bg-green-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {getInitials(`${participante.nombre} ${participante.apellidos}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {participante.nombre} {participante.apellidos}
                              {participante.id === user.uid && " (Tú)"}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{participante.role}</p>
                          </div>
                          <div
                            className={`h-2 w-2 ${participante.conectado ? "bg-green-500" : "bg-gray-300"} rounded-full`}
                          ></div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="materiales" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Materiales de la Clase</h3>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">Presentación de la clase</p>
                            <p className="text-xs text-gray-500">PDF - 2.5 MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">Ejercicios prácticos</p>
                            <p className="text-xs text-gray-500">DOCX - 1.2 MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
