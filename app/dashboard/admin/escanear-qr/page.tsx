"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, getDocs, query, where, getDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { QrCode, Camera, CheckCircle, XCircle, AlertTriangle, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import jsQR from "jsqr"

export default function EscanearQRPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const [alumnoId, setAlumnoId] = useState("")
  const [alumnoData, setAlumnoData] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [asistenciaHoy, setAsistenciaHoy] = useState<any>(null)
  const [formData, setFormData] = useState({
    estado: "presente",
    observaciones: "",
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "profesor") {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    if (alumnoId) {
      buscarAlumno()
    }
  }, [alumnoId])

  const iniciarEscaneo = async () => {
    setEscaneando(true)
    setError("")

    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Comenzar a escanear
        requestAnimationFrame(escanearFrame)
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err)
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
      setEscaneando(false)
    }
  }

  const detenerEscaneo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setEscaneando(false)
  }

  const escanearFrame = async () => {
    if (!escaneando || !videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth

        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code) {
          // Se detectó un código QR
          const qrDetectado = code.data
          setAlumnoId(qrDetectado)
          detenerEscaneo()
        }
      }

      if (escaneando) {
        requestAnimationFrame(escanearFrame)
      }
    } catch (error) {
      console.error("Error al escanear frame:", error)
      setError("Error al procesar el escaneo. Intenta nuevamente.")
      detenerEscaneo()
    }
  }

  const buscarAlumno = async () => {
    setLoading(true)
    try {
      // Buscar al alumno por ID
      const alumnoDoc = await getDoc(doc(db, "users", alumnoId))

      if (!alumnoDoc.exists()) {
        toast({
          title: "Error",
          description: "No se encontró ningún alumno con ese código QR.",
          variant: "destructive",
        })
        setAlumnoId("")
        setLoading(false)
        return
      }

      const alumno = alumnoDoc.data()

      // Verificar si es un alumno
      if (alumno.role !== "alumno") {
        toast({
          title: "Error",
          description: "El código QR no corresponde a un alumno.",
          variant: "destructive",
        })
        setAlumnoId("")
        setLoading(false)
        return
      }

      setAlumnoData(alumno)

      // Verificar si ya tiene asistencia hoy
      const hoy = new Date().toISOString().split("T")[0]
      const asistenciasRef = collection(db, "asistencias")
      const q = query(asistenciasRef, where("alumnoId", "==", alumnoId), where("fecha", "==", hoy))

      const asistenciasSnapshot = await getDocs(q)

      if (!asistenciasSnapshot.empty) {
        setAsistenciaHoy(asistenciasSnapshot.docs[0].data())
      } else {
        setAsistenciaHoy(null)
        setDialogOpen(true)
      }
    } catch (error) {
      console.error("Error al buscar alumno:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar al alumno.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, estado: value }))
  }

  const registrarAsistencia = async () => {
    if (!user || !alumnoData) return

    setLoading(true)
    try {
      const hoy = new Date().toISOString().split("T")[0]
      const hora = new Date().toLocaleTimeString()

      // Obtener asignaciones del alumno para saber a qué grupos pertenece
      const asignacionesRef = collection(db, "asignaciones")
      const q = query(asignacionesRef, where("alumnoId", "==", alumnoId))
      const asignacionesSnapshot = await getDocs(q)

      let grupoId = ""
      let gradoId = ""
      let seccionId = ""
      let cursoId = ""

      if (!asignacionesSnapshot.empty) {
        const asignacion = asignacionesSnapshot.docs[0].data()
        grupoId = asignacion.grupoId

        // Obtener información del grupo
        const grupoDoc = await getDoc(doc(db, "grupos", grupoId))
        if (grupoDoc.exists()) {
          const grupo = grupoDoc.data()
          gradoId = grupo.gradoId || ""
          seccionId = grupo.seccionId || ""
          cursoId = grupo.cursoId || ""
        }
      }

      // Crear registro de asistencia
      await addDoc(collection(db, "asistencias"), {
        alumnoId,
        alumnoNombre: `${alumnoData.nombre} ${alumnoData.apellidos}`,
        fecha: hoy,
        hora,
        estado: formData.estado,
        observaciones: formData.observaciones,
        registradoPor: user.uid,
        registradoPorNombre: `${user.nombre} ${user.apellidos}`,
        grupoId,
        gradoId,
        seccionId,
        cursoId,
        notificado: false,
        createdAt: serverTimestamp(),
      })

      toast({
        title: "Asistencia registrada",
        description: "La asistencia ha sido registrada correctamente.",
      })

      setDialogOpen(false)
      setAlumnoId("")
      setAlumnoData(null)
      setFormData({
        estado: "presente",
        observaciones: "",
      })
    } catch (error) {
      console.error("Error al registrar asistencia:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la asistencia. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const buscarPorDNI = async () => {
    if (!alumnoId) {
      toast({
        title: "Error",
        description: "Ingresa un DNI para buscar.",
        variant: "destructive",
      })
      return
    }

    buscarAlumno()
  }

  // Agregar un timeout para mostrar un mensaje si no se detecta ningún QR
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (escaneando) {
      timeoutId = setTimeout(() => {
        if (escaneando) {
          setError("No se detectó ningún código QR. Asegúrate de que el código esté bien iluminado y visible.")
        }
      }, 10000) // 10 segundos
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [escaneando])

  if (user?.role !== "admin" && user?.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registro de Asistencia</h1>
        <p className="text-gray-500">Escanea el código QR del alumno o ingresa su DNI para registrar su asistencia.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Escanear Código QR</CardTitle>
            <CardDescription>Utiliza la cámara para escanear el código QR del alumno.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {escaneando ? (
                <div className="relative">
                  <video ref={videoRef} className="w-full h-64 object-cover rounded-md border" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg opacity-70"></div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-md border flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-300" />
                </div>
              )}

              {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

              <div className="flex justify-center">
                {escaneando ? (
                  <Button variant="destructive" onClick={detenerEscaneo}>
                    Detener Escaneo
                  </Button>
                ) : (
                  <Button onClick={iniciarEscaneo}>
                    <Camera className="mr-2 h-4 w-4" />
                    Iniciar Escaneo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar por DNI</CardTitle>
            <CardDescription>Ingresa el DNI del alumno para registrar su asistencia manualmente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ingresa el DNI del alumno"
                  value={alumnoId}
                  onChange={(e) => setAlumnoId(e.target.value)}
                />
                <Button onClick={buscarPorDNI} disabled={loading}>
                  Buscar
                </Button>
              </div>

              {loading && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}

              {alumnoData && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-blue-100 p-3">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {alumnoData.nombre} {alumnoData.apellidos}
                        </h3>
                        <p className="text-sm text-gray-500">DNI: {alumnoData.dni}</p>
                        {asistenciaHoy && (
                          <div className="mt-2 flex items-center">
                            {asistenciaHoy.estado === "presente" ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                            ) : asistenciaHoy.estado === "ausente" ? (
                              <XCircle className="h-4 w-4 text-red-600 mr-1" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />
                            )}
                            <span className="text-sm">
                              Ya tiene registro de {asistenciaHoy.estado} hoy a las {asistenciaHoy.hora}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Asistencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {alumnoData && (
              <div className="mb-4">
                <h3 className="font-medium">
                  {alumnoData.nombre} {alumnoData.apellidos}
                </h3>
                <p className="text-sm text-gray-500">DNI: {alumnoData.dni}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presente">Presente</SelectItem>
                  <SelectItem value="tardanza">Tardanza</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                placeholder="Observaciones adicionales"
                value={formData.observaciones}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={registrarAsistencia} disabled={loading}>
                {loading ? "Guardando..." : "Registrar Asistencia"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
