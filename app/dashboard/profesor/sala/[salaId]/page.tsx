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
  updateDoc,
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

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  email: string
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
}

export default function SalaProfesorPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const salaId = params.salaId as string

  const [loading, setLoading] = useState(false)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [clase, setClase] = useState<Clase | null>(null)
  const [grupo, setGrupo] = useState<Grupo | null>(null)

  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<() => void>()

  useEffect(() => {
    if (user && user.role !== "profesor") {
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
        router.push("/dashboard/profesor/grupos")
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
        router.push("/dashboard/profesor/grupos")
        return
      }

      const grupoData = grupoDoc.data()

      // Verificar que el profesor pertenece al grupo
      if (grupoData.profesorId !== user.uid) {
        toast({
          title: "Error",
          description: "No tienes acceso a esta sala virtual.",
          variant: "destructive",
        })
        router.push("/dashboard/profesor/grupos")
        return
      }

      // Obtener información adicional del grupo
      const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
      const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
      const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))

      setGrupo({
        id: grupoDoc.id,
        ...grupoData,
        grado: gradoDoc.exists() ? gradoDoc.data() : undefined,
        seccion: seccionDoc.exists() ? seccionDoc.data() : undefined,
        curso: cursoDoc.exists() ? cursoDoc.data() : undefined,
      })

      // Obtener clase activa
      const clasesQuery = query(
        collection(db, "clases"),
        where("salaId", "==", salaId),
        where("estado", "==", "activa"),
      )

      const clasesSnapshot = await getDocs(clasesQuery)

      if (clasesSnapshot.empty) {
        // No hay clase activa, verificar si hay alguna clase finalizada reciente
        const clasesFinalizadasQuery = query(
          collection(db, "clases"),
          where("salaId", "==", salaId),
          where("estado", "==", "finalizada"),
          orderBy("fechaFin", "desc"),
        )

        const clasesFinalizadasSnapshot = await getDocs(clasesFinalizadasQuery)

        if (!clasesFinalizadasSnapshot.empty) {
          setClase({
            id: clasesFinalizadasSnapshot.docs[0].id,
            ...clasesFinalizadasSnapshot.docs[0].data(),
          } as Clase)
        } else {
          // Crear una nueva clase
          const nuevaClaseRef = await addDoc(collection(db, "clases"), {
            salaId,
            grupoId: grupoDoc.id,
            profesorId: user.uid,
            fechaInicio: new Date().toISOString(),
            fechaFin: null,
            estado: "activa",
          })

          const nuevaClaseDoc = await getDoc(nuevaClaseRef)

          setClase({
            id: nuevaClaseDoc.id,
            ...nuevaClaseDoc.data(),
          } as Clase)
        }
      } else {
        setClase({
          id: clasesSnapshot.docs[0].id,
          ...clasesSnapshot.docs[0].data(),
        } as Clase)
      }

      // Cargar alumnos del grupo
      cargarAlumnos(grupoDoc.id)

      // Cargar mensajes de la sala
      cargarMensajes()
    } catch (error) {
      console.error("Error al cargar datos de la sala:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la sala virtual.",
        variant: "destructive",
      })
      router.push("/dashboard/profesor/grupos")
    } finally {
      setLoading(false)
    }
  }

  const cargarAlumnos = async (grupoId: string) => {
    try {
      // Obtener asignaciones del grupo
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(asignacionesRef, where("grupoId", "==", grupoId))
      const asignacionesSnapshot = await getDocs(asignacionesQuery)

      if (asignacionesSnapshot.empty) {
        setAlumnos([])
        return
      }

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
          conectado: false, // Por defecto, asumimos que no está conectado
        } as Alumno
      })

      const alumnosData = (await Promise.all(alumnosPromises)).filter(Boolean) as Alumno[]

      // Ordenar por apellidos
      alumnosData.sort((a, b) => a.apellidos.localeCompare(b.apellidos))

      setAlumnos(alumnosData)

      // Suscribirse a cambios en la conexión de los alumnos
      // Esto es una simulación - en una aplicación real, se usaría una colección de "presencia"
      const interval = setInterval(() => {
        setAlumnos((prev) =>
          prev.map((alumno) => ({
            ...alumno,
            conectado: Math.random() > 0.5, // Simulación de conexión aleatoria
          })),
        )
      }, 5000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error("Error al cargar alumnos:", error)
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

  const finalizarClase = async () => {
    if (!user || !clase) return

    if (confirm("¿Estás seguro de finalizar esta clase? Los alumnos ya no podrán acceder a ella.")) {
      setLoading(true)
      try {
        await updateDoc(doc(db, "clases", clase.id), {
          fechaFin: new Date().toISOString(),
          estado: "finalizada",
        })

        toast({
          title: "Clase finalizada",
          description: "La clase virtual ha sido finalizada correctamente.",
        })

        router.push("/dashboard/profesor/grupos")
      } catch (error) {
        console.error("Error al finalizar clase:", error)
        toast({
          title: "Error",
          description: "No se pudo finalizar la clase. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
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

  if (!user || user.role !== "profesor") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.push("/dashboard/profesor/grupos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Grupos
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Sala Virtual</h1>
          {grupo && (
            <p className="text-gray-500">
              {grupo.curso?.nombre} - {grupo.grado?.nombre} "{grupo.seccion?.nombre}"
            </p>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={finalizarClase}
          disabled={loading || !clase || clase.estado !== "activa"}
        >
          Finalizar Clase
        </Button>
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
                      <p className="text-xs text-gray-500">Envía un mensaje para iniciar la conversación.</p>
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
                              {mensaje.usuarioRole === "profesor" && mensaje.usuarioId !== user.uid && (
                                <span className="ml-1 text-xs">(Profesor)</span>
                              )}
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
              <Tabs defaultValue="alumnos">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
                  <TabsTrigger value="materiales">Materiales</TabsTrigger>
                </TabsList>

                <TabsContent value="alumnos" className="mt-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div className="flex items-center p-2 bg-green-50 rounded-md">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{getInitials(`${user.nombre} ${user.apellidos}`)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {user.nombre} {user.apellidos}
                        </p>
                        <p className="text-xs text-gray-500">Profesor</p>
                      </div>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </div>

                    {alumnos.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No hay alumnos asignados a este grupo.</p>
                      </div>
                    ) : (
                      alumnos.map((alumno) => (
                        <div key={alumno.id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{getInitials(`${alumno.nombre} ${alumno.apellidos}`)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {alumno.nombre} {alumno.apellidos}
                            </p>
                            <p className="text-xs text-gray-500">Alumno</p>
                          </div>
                          <div
                            className={`h-2 w-2 ${alumno.conectado ? "bg-green-500" : "bg-gray-300"} rounded-full`}
                          ></div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="materiales" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Materiales de la Clase</h3>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Subir Material
                      </Button>
                    </div>

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
