export interface Asistencia {
  id: string
  alumnoId: string
  alumnoNombre: string
  fecha: string
  hora: string
  estado: "presente" | "ausente" | "tardanza"
  observaciones?: string
  registradoPor: string
  registradoPorNombre: string
  tipo: "general" | "curso" // Tipo de asistencia: general (entrada al colegio) o curso (clase específica)
  grupoId?: string // Solo para asistencia de curso
  gradoId?: string
  seccionId?: string
  cursoId?: string
  notificado: boolean
  createdAt: any
}
