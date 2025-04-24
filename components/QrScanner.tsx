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
    return () => {
      // Limpieza al desmontar
      if (scannerRef.current) {
        scannerRef.current.destroy()
      }
    }
  }, [])

  const startScanner = async () => {
    if (!videoRef.current) return

    try {
      console.log("Iniciando scanner...")
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("QR detectado:", result.data)
          onScan(result.data)
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      )

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
          <div className="absolute inset-0 border-2 border-dashed border-blue-500 m-8 pointer-events-none"></div>
        )}
      </div>
      
      <Button
        onClick={() => isScanning ? stopScanner() : startScanner()}
        className="w-full mt-4"
        variant={isScanning ? "destructive" : "default"}
      >
        {isScanning ? "Detener Scanner" : "Iniciar Scanner"}
      </Button>
    </div>
  )
} 