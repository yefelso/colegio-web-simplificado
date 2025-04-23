"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, getDoc, doc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Camera, QrCode, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { parseQRCode } from "@/lib/qr-utils"
import jsQR from "jsqr"

export default function EscanearQR() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      // Limpiar el stream de la cámara cuando el componente se desmonte
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Limpiar el timeout si existe
      if (scanTimeout) {
        clearTimeout(scanTimeout)
      }

      // Cancelar la animación si existe
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [scanTimeout])

  const startScanning = async () => {
    try {
      setCameraError(null)
      setScanResult(null)
      setScanning(true)

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Iniciar el escaneo de frames
        scanQRCode()

        // Establecer un timeout para mostrar un mensaje si tarda demasiado
        const timeout = setTimeout(() => {
          toast({
            title: "Escaneo en progreso",
            description: "Asegúrate de que el código QR esté bien iluminado y centrado en la pantalla.",
            duration: 5000,
          })
        }, 10000) // 10 segundos

        setScanTimeout(timeout)
      }
    } catch (error: any) {
      console.error("Error al acceder a la cámara:", error)
      setCameraError(error.message || "No se pudo acceder a la cámara")
      setScanning(false)

      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos del navegador.",
        variant: "destructive",
      })
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (scanTimeout) {
      clearTimeout(scanTimeout)
      setScanTimeout(null)
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    setScanning(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !scanning) return

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    const video = videoRef.current

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      // Establecer dimensiones del canvas
      canvas.height = video.videoHeight
      canvas.width = video.videoWidth

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Obtener los datos de la imagen
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      try {
        // Intentar decodificar el código QR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code) {
          console.log("¡Código QR detectado!", code.data)

          // Detener el escaneo y procesar el código
          stopScanning()
          processQRCode(code.data)
          return
        }
      } catch (error) {
        console.error("Error al procesar el frame:", error)
      }
    }

    // Continuar escaneando en el próximo frame
    animationRef.current = requestAnimationFrame(scanQRCode)
  }

  const processQRCode = async (qrData: string) => {
    setProcessing(true)

    try {
      toast({
        title: "Código QR detectado",
        description: "Procesando información...",
      })

      // Parsear el código QR
      const qrInfo = parseQRCode(qrData)

      if (!qrInfo.isValid) {
        setScanResult({
          success: false,
          message: "Código QR no válido. No tiene el formato correcto.",
        })

        toast({
          title: "Error",
          description: "Código QR no válido. No tiene el formato correcto.",
          variant: "destructive",
        })
        return
      }

      // Obtener el ID del usuario
      const userId = qrInfo.id
      if (!userId) {
        setScanResult({
          success: false,
          message: "Código QR no contiene ID de usuario.",
        })

        toast({
          title: "Error",
          description: "Código QR no contiene ID de usuario.",
          variant: "destructive",
        })
        return
      }

      // Buscar al usuario en la base de datos
      const userDoc = await getDoc(doc(db, "users", userId))

      if (!userDoc.exists()) {
        setScanResult({
          success: false,
          message: "No se encontró ningún usuario con ese código QR.",
        })

        toast({
          title: "Error",
          description: "No se encontró ningún usuario con ese código QR.",
          variant: "destructive",
        })
        return
      }

      const userData = userDoc.data()

      // Verificar si ya tiene asistencia registrada hoy
      const hoy = new Date().toISOString().split("T")[0]
      const asistenciasRef = collection(db, "asistencias")
      const q = query(
        asistenciasRef,
        where("userId", "==", userId),
        where("fecha", "==", hoy),
        where("tipo", "==", "entrada"),
      )

      const asistenciasSnapshot = await getDocs(q)

      if (!asistenciasSnapshot.empty) {
        setScanResult({
          success: true,
          message: `${userData.nombre} ${userData.apellidos} ya tiene asistencia registrada hoy.`,
        })

        toast({
          title: "Asistencia ya registrada",
          description: `${userData.nombre} ${userData.apellidos} ya tiene asistencia registrada hoy.`,
        })
        return
      }

      // Registrar la asistencia
      const hora = new Date().toLocaleTimeString()
      let estado = "presente"

      // Determinar si es tardanza basado en la hora (ejemplo: después de las 8:00 AM)
      const horaActual = new Date().getHours() * 100 + new Date().getMinutes()
      if (horaActual > 800) {
        // 8:00 AM
        estado = "tardanza"
      }

      // Crear registro de asistencia
      await addDoc(collection(db, "asistencias"), {
        userId: userId,
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        role: userData.role,
        fecha: hoy,
        hora,
        estado,
        observaciones: estado === "tardanza" ? "Llegada tarde" : "",
        registradoPor: user?.uid,
        registradoPorNombre: `${user?.nombre} ${user?.apellidos}`,
        tipo: "entrada",
        notificado: false,
        createdAt: serverTimestamp(),
      })

      setScanResult({
        success: true,
        message: `Asistencia de ${userData.nombre} ${userData.apellidos} registrada como ${estado}.`,
      })

      toast({
        title: "Asistencia registrada",
        description: `Asistencia de ${userData.nombre} ${userData.apellidos} registrada como ${estado}.`,
      })
    } catch (error) {
      console.error("Error al procesar el código QR:", error)
      setScanResult({
        success: false,
        message: "Error al procesar el código QR. Inténtalo de nuevo.",
      })

      toast({
        title: "Error",
        description: "Error al procesar el código QR. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Escanear QR</h1>
        <p className="text-gray-500">Escanea el código QR para registrar asistencia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escáner de Asistencia</CardTitle>
          <CardDescription>
            Apunta la cámara al código QR del estudiante o profesor para registrar su asistencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            {scanning ? (
              <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted></video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg opacity-70"></div>
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center text-white text-sm bg-black bg-opacity-50 py-1">
                  Buscando código QR...
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                {processing ? (
                  <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-2" />
                ) : (
                  <QrCode className="h-12 w-12 text-gray-400 mb-2" />
                )}
                <p className="text-gray-500">{processing ? "Procesando código QR..." : "La cámara está desactivada"}</p>
              </div>
            )}

            {cameraError && (
              <Alert variant="destructive" className="mt-4 w-full max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {scanResult && (
              <Alert variant={scanResult.success ? "default" : "destructive"} className="mt-4 w-full max-w-md">
                {scanResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{scanResult.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>{scanResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {scanning ? (
            <Button variant="destructive" onClick={stopScanning} disabled={processing}>
              Detener Escaneo
            </Button>
          ) : (
            <Button onClick={startScanning} disabled={processing} className="gap-2">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {processing ? "Procesando..." : "Iniciar Escaneo"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
