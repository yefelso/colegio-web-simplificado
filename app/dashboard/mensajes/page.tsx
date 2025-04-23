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
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Send, User, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Mensaje {
  id: string
  emisorId: string
  receptorId: string
  contenido: string
  leido: boolean
  fecha: Timestamp
  emisorNombre?: string
  receptorNombre?: string
}

interface Conversacion {
  id: string
  usuarioId: string
  nombre: string
  ultimoMensaje: string
  fecha: Timestamp
  noLeidos: number
}

interface Usuario {
  id: string
  nombre: string
  apellidos: string
  email: string
  role: string
}

export default function MensajesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [terminoBusqueda, setTerminoBusqueda] = useState("")
  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<() => void>()

  useEffect(() => {
    if (user) {
      cargarConversaciones()
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [user])

  useEffect(() => {
    if (usuarioSeleccionado) {
      cargarMensajes(usuarioSeleccionado)
    }
  }, [usuarioSeleccionado])

  useEffect(() => {
    scrollToBottom()
  }, [mensajes])

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const cargarConversaciones = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Obtener mensajes enviados por el usuario
      const mensajesEnviadosQuery = query(
        collection(db, "mensajes"),
        where("emisorId", "==", user.uid),
        orderBy("fecha", "desc"),
      )

      // Obtener mensajes recibidos por el usuario
      const mensajesRecibidosQuery = query(
        collection(db, "mensajes"),
        where("receptorId", "==", user.uid),
        orderBy("fecha", "desc"),
      )

      const [mensajesEnviadosSnapshot, mensajesRecibidosSnapshot] = await Promise.all([
        getDocs(mensajesEnviadosQuery),
        getDocs(mensajesRecibidosQuery),
      ])

      // Combinar los IDs de usuarios con los que se ha conversado
      const usuariosIds = new Set<string>()

      mensajesEnviadosSnapshot.docs.forEach((doc) => {
        usuariosIds.add(doc.data().receptorId)
      })

      mensajesRecibidosSnapshot.docs.forEach((doc) => {
        usuariosIds.add(doc.data().emisorId)
      })

      // Obtener información de cada usuario
      const conversacionesPromises = Array.from(usuariosIds).map(async (usuarioId) => {
        const usuarioDoc = await getDoc(doc(db, "users", usuarioId))

        if (!usuarioDoc.exists()) return null

        const usuarioData = usuarioDoc.data()

        // Obtener el último mensaje de la conversación
        const ultimoMensajeQuery = query(
          collection(db, "mensajes"),
          where("emisorId", "in", [user.uid, usuarioId]),
          where("receptorId", "in", [user.uid, usuarioId]),
          orderBy("fecha", "desc"),
        )

        const ultimoMensajeSnapshot = await getDocs(ultimoMensajeQuery)

        if (ultimoMensajeSnapshot.empty) return null

        const ultimoMensajeData = ultimoMensajeSnapshot.docs[0].data()

        // Contar mensajes no leídos
        const mensajesNoLeidosQuery = query(
          collection(db, "mensajes"),
          where("emisorId", "==", usuarioId),
          where("receptorId", "==", user.uid),
          where("leido", "==", false),
        )

        const mensajesNoLeidosSnapshot = await getDocs(mensajesNoLeidosQuery)

        return {
          id: usuarioId,
          usuarioId,
          nombre: `${usuarioData.nombre} ${usuarioData.apellidos}`,
          ultimoMensaje: ultimoMensajeData.contenido,
          fecha: ultimoMensajeData.fecha,
          noLeidos: mensajesNoLeidosSnapshot.size,
        } as Conversacion
      })

      const conversacionesData = (await Promise.all(conversacionesPromises)).filter(Boolean) as Conversacion[]

      // Ordenar por fecha del último mensaje
      conversacionesData.sort((a, b) => b.fecha.seconds - a.fecha.seconds)

      setConversaciones(conversacionesData)
    } catch (error) {
      console.error("Error al cargar conversaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarMensajes = (usuarioId: string) => {
    if (!user) return

    setLoading(true)

    // Desuscribirse de la suscripción anterior si existe
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    try {
      const mensajesQuery = query(
        collection(db, "mensajes"),
        where("emisorId", "in", [user.uid, usuarioId]),
        where("receptorId", "in", [user.uid, usuarioId]),
        orderBy("fecha", "asc"),
      )

      // Usar onSnapshot para recibir actualizaciones en tiempo real
      const unsubscribe = onSnapshot(mensajesQuery, async (snapshot) => {
        const mensajesData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data()

            // Obtener nombres de emisor y receptor
            const [emisorDoc, receptorDoc] = await Promise.all([
              getDoc(doc(db, "users", data.emisorId)),
              getDoc(doc(db, "users", data.receptorId)),
            ])

            return {
              id: doc.id,
              ...data,
              fecha: data.fecha,
              emisorNombre: emisorDoc.exists()
                ? `${emisorDoc.data().nombre} ${emisorDoc.data().apellidos}`
                : "Usuario desconocido",
              receptorNombre: receptorDoc.exists()
                ? `${receptorDoc.data().nombre} ${receptorDoc.data().apellidos}`
                : "Usuario desconocido",
            } as Mensaje
          }),
        )

        setMensajes(mensajesData)
        setLoading(false)
      })

      unsubscribeRef.current = unsubscribe
    } catch (error) {
      console.error("Error al cargar mensajes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const buscarUsuarios = async () => {
    if (!user || !terminoBusqueda.trim()) return

    setBuscando(true)
    try {
      const usuariosRef = collection(db, "users")
      const usuariosSnapshot = await getDocs(usuariosRef)

      const usuariosData = usuariosSnapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Usuario,
        )
        .filter(
          (usuario) =>
            usuario.id !== user.uid &&
            (usuario.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
              usuario.apellidos.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
              usuario.email.toLowerCase().includes(terminoBusqueda.toLowerCase())),
        )

      setUsuarios(usuariosData)
    } catch (error) {
      console.error("Error al buscar usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron buscar usuarios.",
        variant: "destructive",
      })
    } finally {
      setBuscando(false)
    }
  }

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !usuarioSeleccionado || !nuevoMensaje.trim()) return

    setLoading(true)
    try {
      await addDoc(collection(db, "mensajes"), {
        emisorId: user.uid,
        receptorId: usuarioSeleccionado,
        contenido: nuevoMensaje,
        leido: false,
        fecha: serverTimestamp(),
      })

      setNuevoMensaje("")

      // Actualizar conversaciones
      cargarConversaciones()
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const seleccionarUsuario = (usuarioId: string) => {
    setUsuarioSeleccionado(usuarioId)
    setUsuarios([])
    setTerminoBusqueda("")
  }

  const formatearFecha = (timestamp: Timestamp) => {
    if (!timestamp) return ""

    const fecha = timestamp.toDate()
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(hoy.getDate() - 1)

    if (fecha.toDateString() === hoy.toDateString()) {
      return fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return `Ayer ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return fecha.toLocaleDateString([], { day: "numeric", month: "short" })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
        <p className="text-gray-500">Comunícate con otros usuarios del sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Buscar usuario..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarUsuarios()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={buscarUsuarios}
                  disabled={buscando}
                >
                  {buscando ? "..." : "Buscar"}
                </Button>
              </div>

              {usuarios.length > 0 && (
                <div className="border rounded-md p-2 space-y-2">
                  <h4 className="text-sm font-medium">Resultados de búsqueda</h4>
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                      onClick={() => seleccionarUsuario(usuario.id)}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{getInitials(`${usuario.nombre} ${usuario.apellidos}`)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {usuario.nombre} {usuario.apellidos}
                        </p>
                        <p className="text-xs text-gray-500">{usuario.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {loading && conversaciones.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : conversaciones.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-sm font-medium mb-2">No hay conversaciones</h3>
                    <p className="text-xs text-gray-500">Busca usuarios para iniciar una conversación.</p>
                  </div>
                ) : (
                  conversaciones.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        usuarioSeleccionado === conv.id ? "bg-blue-50" : "hover:bg-gray-100"
                      }`}
                      onClick={() => seleccionarUsuario(conv.id)}
                    >
                      <Avatar className="h-10 w-10 mr-2">
                        <AvatarFallback>{getInitials(conv.nombre)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium truncate">{conv.nombre}</p>
                          <p className="text-xs text-gray-500">{formatearFecha(conv.fecha)}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{conv.ultimoMensaje}</p>
                      </div>
                      {conv.noLeidos > 0 && (
                        <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.noLeidos}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {usuarioSeleccionado
                ? conversaciones.find((c) => c.id === usuarioSeleccionado)?.nombre ||
                  usuarios.find((u) => u.id === usuarioSeleccionado)?.nombre +
                    " " +
                    usuarios.find((u) => u.id === usuarioSeleccionado)?.apellidos
                : "Selecciona una conversación"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!usuarioSeleccionado ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay conversación seleccionada</h3>
                <p className="text-gray-500">
                  Selecciona una conversación existente o busca un usuario para iniciar una nueva.
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-[400px]">
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                  {loading && mensajes.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : mensajes.length === 0 ? (
                    <div className="text-center py-6">
                      <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-sm font-medium mb-2">No hay mensajes</h3>
                      <p className="text-xs text-gray-500">Envía un mensaje para iniciar la conversación.</p>
                    </div>
                  ) : (
                    mensajes.map((mensaje) => (
                      <div
                        key={mensaje.id}
                        className={`flex ${mensaje.emisorId === user.uid ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            mensaje.emisorId === user.uid ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                          }`}
                        >
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
                    disabled={!usuarioSeleccionado || loading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!usuarioSeleccionado || !nuevoMensaje.trim() || loading}
                    className="ml-2"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
