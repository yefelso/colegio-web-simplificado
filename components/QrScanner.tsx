"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface QrScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    // Inicializar el escáner
    scannerRef.current = new Html5Qrcode("qr-reader")

    // Limpiar al desmontar
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log("Scanner stopped successfully")
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err)
          })
      }
    }
  }, [])

  useEffect(() => {
    if (!scannerRef.current) return

    if (isScanning) {
      console.log("Starting QR scanner...")
      
      scannerRef.current
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log("QR Code detected:", decodedText)
            onScan(decodedText)
          },
          (errorMessage) => {
            console.error("QR Scan error:", errorMessage)
            onError?.(errorMessage)
          }
        )
        .catch((err) => {
          console.error("Error starting scanner:", err)
          onError?.(err.toString())
        })
    } else {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log("Scanner stopped successfully")
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err)
          })
      }
    }
  }, [isScanning, onScan, onError])

  return (
    <div className="w-full max-w-md mx-auto">
      <div id="qr-reader" className="w-full"></div>
      <button
        onClick={() => setIsScanning(!isScanning)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {isScanning ? "Detener Scanner" : "Iniciar Scanner"}
      </button>
    </div>
  )
} 