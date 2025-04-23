import QRCode from "qrcode"

// Modificar la función generateQRCode para asegurar un formato consistente
export async function generateQRCode(data: string): Promise<string> {
  try {
    // Asegurar que el formato del QR sea consistente
    // Formato: COLEGIO:TIPO:ID:DNI
    // Donde TIPO puede ser ALUMNO, PROFESOR, AUXILIAR, ADMIN

    // Si el dato ya tiene el formato correcto, lo usamos directamente
    if (data.startsWith("COLEGIO:")) {
      // Usar directamente el formato proporcionado
    } else if (data.includes(":")) {
      // Extraer información del formato antiguo
      const parts = data.split(":")
      const dni = parts[0]
      const id = parts[1]
      const role = "ALUMNO" // Por defecto asumimos alumno
      data = `COLEGIO:${role}:${id}:${dni}`
    }

    // Generar el QR como data URL para evitar problemas con blob URLs
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error("Error generando QR:", error)
    throw error
  }
}

// Agregar una función para decodificar el QR
export function parseQRCode(qrData: string): {
  isValid: boolean
  tipo?: string
  id?: string
  dni?: string
} {
  if (!qrData || !qrData.startsWith("COLEGIO:")) {
    return { isValid: false }
  }

  try {
    const parts = qrData.split(":")
    if (parts.length < 3) {
      return { isValid: false }
    }

    return {
      isValid: true,
      tipo: parts[1],
      id: parts[2],
      dni: parts.length > 3 ? parts[3] : undefined,
    }
  } catch (error) {
    console.error("Error parseando QR:", error)
    return { isValid: false }
  }
}
