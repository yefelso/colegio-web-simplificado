"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Video, VideoOff, Mic, MicOff, Monitor, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SalaVirtualPage() {
  const { salaId } = useParams()
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([])
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<{ user: string; text: string; timestamp: Date }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isInIframe, setIsInIframe] = useState(false)
  const [screenShareError, setScreenShareError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Verificar si estamos en un iframe
    try {
      setIsInIframe(window.self !== window.top)
    } catch (e) {
      setIsInIframe(true) // Si hay un error al acceder a window.self, probablemente estamos en un iframe
    }
  }, [])

  const checkPermissions = async () => {
    try {
      // Verificar permisos de cámara y micrófono
      const permissions = await navigator.permissions.query({ name: "camera" as PermissionName })
      if (permissions.state === "denied") {
        setPermissionError(
          "El acceso a la cámara ha sido bloqueado. Por favor, habilita los permisos en la configuración de tu navegador.",
        )
        setPermissionDialogOpen(true)
        return false
      }
      return true
    } catch (error) {
      console.error("Error al verificar permisos:", error)
      // Si no podemos verificar los permisos, intentamos acceder directamente
      return true
    }
  }

  const toggleCamera = async () => {
    try {
      if (!(await checkPermissions())) return

      if (isCameraOn) {
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => track.stop())
          setLocalStream((prev) => {
            if (prev) {
              const newStream = prev.clone()
              newStream.getVideoTracks().forEach((track) => newStream.removeTrack(track))
              return newStream
            }
            return null
          })
        }
        setIsCameraOn(false)
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (localStream) {
            // Si ya tenemos un stream (por ejemplo, con audio), añadimos las pistas de video
            stream.getVideoTracks().forEach((track) => {
              localStream.addTrack(track)
            })
            setLocalStream(localStream)
          } else {
            setLocalStream(stream)
          }
          setIsCameraOn(true)
          setError(null)
        } catch (err) {
          console.error("Error al acceder a la cámara:", err)
          setPermissionError(
            "No se pudo acceder a la cámara. Verifica que tienes una cámara conectada y que has concedido los permisos necesarios.",
          )
          setPermissionDialogOpen(true)
        }
      }
    } catch (err) {
      console.error("Error al alternar la cámara:", err)
      setError("Error al alternar la cámara: " + (err instanceof Error ? err.message : String(err)))
    }
  }

  const toggleMicrophone = async () => {
    try {
      if (!(await checkPermissions())) return

      if (isMicOn) {
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => track.stop())
          setLocalStream((prev) => {
            if (prev) {
              const newStream = prev.clone()
              newStream.getAudioTracks().forEach((track) => newStream.removeTrack(track))
              return newStream
            }
            return null
          })
        }
        setIsMicOn(false)
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          if (localStream) {
            // Si ya tenemos un stream (por ejemplo, con video), añadimos las pistas de audio
            stream.getAudioTracks().forEach((track) => {
              localStream.addTrack(track)
            })
            setLocalStream(localStream)
          } else {
            setLocalStream(stream)
          }
          setIsMicOn(true)
          setError(null)
        } catch (err) {
          console.error("Error al acceder al micrófono:", err)
          setPermissionError(
            "No se pudo acceder al micrófono. Verifica que tienes un micrófono conectado y que has concedido los permisos necesarios.",
          )
          setPermissionDialogOpen(true)
        }
      }
    } catch (err) {
      console.error("Error al alternar el micrófono:", err)
      setError("Error al alternar el micrófono: " + (err instanceof Error ? err.message : String(err)))
    }
  }

  const toggleCompartirPantalla = async () => {
    try {
      if (isScreenSharing) {
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            if (track.kind === "video" && track.label.includes("screen")) {
              track.stop()
            }
          })
        }
        setIsScreenSharing(false)
        setScreenShareError(null)
      } else {
        try {
          // Verificar si estamos en un iframe
          if (isInIframe) {
            setScreenShareError(
              "La compartición de pantalla no está disponible en un iframe por razones de seguridad. Por favor, abre esta página en una nueva ventana.",
            )
            return
          }

          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })

          // Manejar cuando el usuario detiene la compartición de pantalla
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false)
          }

          setLocalStream(stream)
          setIsScreenSharing(true)
          setScreenShareError(null)
        } catch (err) {
          console.error("Error al compartir pantalla:", err)

          // Detectar el error específico de permisos
          if (err instanceof Error && err.name === "NotAllowedError") {
            if (err.message.includes("Permission denied") || err.message.includes("Permission dismissed")) {
              setScreenShareError(
                "Permiso denegado para compartir pantalla. Por favor, concede el permiso cuando se te solicite.",
              )
            } else if (err.message.includes("display-capture")) {
              setScreenShareError(
                "La compartición de pantalla no está permitida por la política de permisos. Intenta abrir esta página en una nueva ventana.",
              )
            } else {
              setScreenShareError("No se pudo compartir la pantalla: permiso denegado.")
            }
          } else {
            setScreenShareError("Error al compartir pantalla: " + (err instanceof Error ? err.message : String(err)))
          }
        }
      }
    } catch (err) {
      console.error("Error al alternar compartir pantalla:", err)
      setError("Error al alternar compartir pantalla: " + (err instanceof Error ? err.message : String(err)))
    }
  }

  const openInNewWindow = () => {
    const url = window.location.href
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        user: user?.displayName || "Usuario",
        text: message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      setMessage("")
    }
  }

  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Sala Virtual: {salaId}</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Video</CardTitle>
              <CardDescription>Transmisión de video en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                {localStream ? (
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover"></video>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">Sin transmisión de video</p>
                  </div>
                )}
              </div>

              {screenShareError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error al compartir pantalla</AlertTitle>
                  <AlertDescription>
                    {screenShareError}
                    {isInIframe && (
                      <div className="mt-2">
                        <Button variant="outline" onClick={openInNewWindow}>
                          Abrir en nueva ventana
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button
                variant={isCameraOn ? "default" : "outline"}
                size="icon"
                onClick={toggleCamera}
                className={isCameraOn ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button variant={isMicOn ? "default" : "outline"} />
              <Button
                variant={isMicOn ? "default" : "outline"}
                size="icon"
                onClick={toggleMicrophone}
                className={isMicOn ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="icon"
                onClick={toggleCompartirPantalla}
                className={isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Monitor className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
              <CardDescription>Usuarios conectados a la sala</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.displayName || "Usuario"}</p>
                    <p className="text-sm text-gray-500">{user?.email || ""}</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <div className={`h-2 w-2 rounded-full ${isMicOn ? "bg-green-500" : "bg-red-500"}`}></div>
                    <div className={`h-2 w-2 rounded-full ${isCameraOn ? "bg-green-500" : "bg-red-500"}`}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Tabs defaultValue="chat">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Chat</CardTitle>
                  <CardDescription>Mensajes de la sala</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-500">No hay mensajes aún</p>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={index} className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{msg.user}</span>
                            <span className="text-xs text-gray-500">
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="mt-1">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full gap-2">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button size="icon" onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="notas">
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                  <CardDescription>Toma notas durante la clase</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Escribe tus notas aquí..." className="min-h-[300px]" />
                </CardContent>
                <CardFooter>
                  <Button>Guardar notas</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permisos necesarios</DialogTitle>
            <DialogDescription>
              Para utilizar la sala virtual, necesitas conceder permisos de cámara y micrófono.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <h3 className="font-medium">Cómo habilitar permisos:</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Chrome:</strong> Haz clic en el icono de candado en la barra de direcciones &gt; Permisos &gt;
                Habilita Cámara y Micrófono.
              </p>
              <p className="text-sm">
                <strong>Firefox:</strong> Haz clic en el icono de candado en la barra de direcciones &gt; Permisos &gt;
                Habilita Cámara y Micrófono.
              </p>
              <p className="text-sm">
                <strong>Safari:</strong> Preferencias &gt; Sitios web &gt; Cámara/Micrófono &gt; Permitir.
              </p>
            </div>
            {permissionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{permissionError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
