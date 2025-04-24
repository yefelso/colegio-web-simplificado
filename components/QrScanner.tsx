"use client"

import { useEffect, useRef, useState } from "react"
import QrScanner from "qr-scanner"
import { Button } from "@/components/ui/button"

interface QrScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function QrScannerComponent({ onScan, onError }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  useEffect(() => {
    // Limpiar al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy()
      }
    }
  }, [])

  const startScanner = async () => {
    if (!videoRef.current) return

    try {
      console.log("Iniciando scanner...")
      
      // Configurar el scanner con opciones mejoradas
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result: QrScanner.ScanResult) => {
          console.log("QR detectado:", result)
          onScan(result.data)
        },
        {
          preferredCamera: 'environment', // Usar cámara trasera
          highlightScanRegion: true, // Mostrar región de escaneo
          highlightCodeOutline: true, // Resaltar el código cuando se detecta
          maxScansPerSecond: 5, // Reducir la frecuencia de escaneo
          returnDetailedScanResult: true,
          qrEngine: QrScanner.WORKER_PATH, // Usar worker dedicado
          // Configuraciones específicas para mejorar la detección
          calculateScanRegion: (video: HTMLVideoElement) => {
            const smallestDimension = Math.min(video.videoWidth, video.videoHeight)
            const scanRegionSize = Math.round(smallestDimension * 0.6) // 60% del tamaño
            
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize,
            }
          }
        }
      )

      // Verificar y activar la linterna si está disponible
      const hasFlash = await scannerRef.current.hasFlash()
      console.log("Linterna disponible:", hasFlash)
      if (hasFlash) {
        try {
          await scannerRef.current.turnFlashOn()
        } catch (e) {
          console.log("Error al encender la linterna:", e)
        }
      }

      await scannerRef.current.start()
      setIsScanning(true)
      console.log("Scanner iniciado correctamente")
    } catch (error) {
      console.error("Error al iniciar el scanner:", error)
      onError?.(error instanceof Error ? error.message : "Error al iniciar el scanner")
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      console.log("Deteniendo scanner...")
      if (scannerRef.current.isFlashOn()) {
        scannerRef.current.turnFlashOff()
      }
      scannerRef.current.stop()
      setIsScanning(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
        />
        {isScanning && (
          <>
            <div className="absolute inset-0 border-2 border-dashed border-blue-500 m-8 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <p className="text-white text-center text-sm">
                Centra el código QR en el recuadro
              </p>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        <Button
          onClick={() => isScanning ? stopScanner() : startScanner()}
          className="w-full"
          variant={isScanning ? "destructive" : "default"}
        >
          {isScanning ? "Detener Scanner" : "Iniciar Scanner"}
        </Button>
        
        <p className="text-sm text-center text-gray-500">
          {isScanning ? 
            "Asegúrate de que el QR esté bien iluminado y dentro del recuadro" : 
            "Presiona el botón para comenzar a escanear"
          }
        </p>
      </div>
    </div>
  )
} 