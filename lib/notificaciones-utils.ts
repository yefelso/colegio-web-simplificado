import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
import type { Notificacion } from "./models/notificacion"

export async function crearNotificacion(
  userId: string,
  titulo: string,
  mensaje: string,
  tipo: "info" | "warning" | "error" | "success",
  enlace?: string,
) {
  try {
    const notificacionData: Omit<Notificacion, "id"> = {
      userId,
      titulo,
      mensaje,
      tipo,
      leida: false,
      fecha: serverTimestamp() as any,
      enlace,
    }

    const docRef = await addDoc(collection(db, "notificaciones"), notificacionData)
    return docRef.id
  } catch (error) {
    console.error("Error al crear notificación:", error)
    throw error
  }
}

export async function crearNotificacionesPrueba(userId: string) {
  try {
    const notificaciones = [
      {
        titulo: "Bienvenido al sistema",
        mensaje: "Gracias por unirte a nuestro sistema escolar. Aquí recibirás notificaciones importantes.",
        tipo: "info" as const,
      },
      {
        titulo: "Asistencia registrada",
        mensaje: "Tu asistencia ha sido registrada correctamente para el día de hoy.",
        tipo: "success" as const,
      },
      {
        titulo: "Recordatorio de entrega",
        mensaje: "Recuerda que tienes una entrega pendiente para el curso de Matemáticas.",
        tipo: "warning" as const,
        enlace: "/dashboard/tareas",
      },
      {
        titulo: "Error en el sistema",
        mensaje: "Hubo un problema al cargar tus calificaciones. Estamos trabajando para solucionarlo.",
        tipo: "error" as const,
      },
    ]

    const promesas = notificaciones.map((n) => crearNotificacion(userId, n.titulo, n.mensaje, n.tipo, n.enlace))

    await Promise.all(promesas)
    return true
  } catch (error) {
    console.error("Error al crear notificaciones de prueba:", error)
    return false
  }
}
