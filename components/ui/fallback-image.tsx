"use client"

import type React from "react"

import { useState } from "react"
import { QrCode } from "lucide-react"

interface FallbackImageProps {
  src: string
  alt: string
  width: number
  height: number
  fallbackComponent?: React.ReactNode
}

export function FallbackImage({ src, alt, width, height, fallbackComponent }: FallbackImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      fallbackComponent || (
        <div
          className="flex items-center justify-center bg-gray-100 rounded-md"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <QrCode className="h-10 w-10 text-gray-400" />
        </div>
      )
    )
  }

  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px` }}
      onError={() => setError(true)}
    />
  )
}
