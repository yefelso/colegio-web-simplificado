import type { Timestamp } from "firebase/firestore"

export interface Notificacion {
  id?: string
  userId: string
  titulo: string
  mensaje: string
  tipo: "info" | "warning" | "error" | "success"
  leida: boolean
  fecha: Timestamp
  enlace?: string
  icono?: string
}
