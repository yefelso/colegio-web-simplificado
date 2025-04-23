"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { FileText, BookOpen, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Calificacion {
  id: string
  alumnoId: string
  grupoId: string
  valor: number
  descripcion: string
  fecha: string
  periodo: string
}

interface Grupo {
  id: string
  gradoId: string
  seccionId: string
  cursoId: string
  profesorId: string
  anioEscolar: string
  grado?: {
    nombre: string
    nivel: string
  }
  seccion?: {
    nombre: string
  }
  curso?: {
    nombre: string
  }
  profesor?: {
    nombre: string
    apellidos: string
  }
}

export default function CalificacionesAlumnoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const grupoId = params.grupoId as string

  const [loading, setLoading] = useState(false)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([])
  const [promedioPorPeriodo, setPromedioPorPeriodo] = useState<Record<string, number>>({})

  useEffect(() => {
    if (user && user.role !== "alumno") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatos()
    }
  }, [user, router, grupoId])

  const cargarDatos = async () => {
    if (!user || !grupoId) return

    setLoading(true)
    try {
      // Verificar que el alumno está asignado al grupo
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(
        asignacionesRef,
        where("alumnoId", "==", user.uid),
        where("grupoId", "==", grupoId),
      )
      const asignacionesSnapshot = await getDocs(asignacionesQuery)

      if (asignacionesSnapshot.empty) {
        toast({
          title: "Error",
          description: "No tienes acceso a este grupo.",
          variant: "destructive",
        })
        router.push("/dashboard/alumno/cursos")
        return
      }

      // Obtener información del grupo
      const grupoDoc = await getDoc(doc(db, "grupos", grupoId))

      if (!grupoDoc.exists()) {
        toast({
          title: "Error",
          description: "El grupo no existe.",
          variant: "destructive",
        })
        router.push("/dashboard/alumno/cursos")
        return
      }

      const grupoData = grupoDoc.data()
      const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
      const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
      const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))
      const profesorDoc = await getDoc(doc(db, "users", grupoData.profesorId))

      setGrupo({
        id: grupoDoc.id,
        ...grupoData,
        grado: gradoDoc.exists() ? gradoDoc.data() : undefined,
        seccion: seccionDoc.exists() ? seccionDoc.data() : undefined,
        curso: cursoDoc.exists() ? cursoDoc.data() : undefined,
        profesor: profesorDoc.exists() ? profesorDoc.data() : undefined,
      } as Grupo)

      // Obtener calificaciones del alumno en este grupo
      const calificacionesRef = collection(db, "calificaciones")
      const calificacionesQuery = query(
        calificacionesRef,
        where("alumnoId", "==", user.uid),
        where("grupoId", "==", grupoId),
      )
      const calificacionesSnapshot = await getDocs(calificacionesQuery)

      if (calificacionesSnapshot.empty) {
        setCalificaciones([])
      } else {
        const calificacionesData = calificacionesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Calificacion[]

        // Ordenar por fecha
        calificacionesData.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

        setCalificaciones(calificacionesData)

        // Calcular promedio por periodo
        const periodos: Record<string, number[]> = {}

        calificacionesData.forEach((cal) => {
          if (!periodos[cal.periodo]) {
            periodos[cal.periodo] = []
          }
          periodos[cal.periodo].push(cal.valor)
        })

        const promedios: Record<string, number> = {}

        Object.entries(periodos).forEach(([periodo, valores]) => {
          const suma = valores.reduce((acc, val) => acc + val, 0)
          promedios[periodo] = Number.parseFloat((suma / valores.length).toFixed(2))
        })

        setPromedioPorPeriodo(promedios)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus calificaciones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCalificacionColor = (valor: number) => {
    if (valor >= 90) return "text-green-600"
    if (valor >= 80) return "text-blue-600"
    if (valor >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (user?.role !== "alumno") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/alumno/cursos">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cursos
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Calificaciones</h1>
          {grupo && (
            <p className="text-gray-500">
              {grupo.curso?.nombre} - {grupo.grado?.nombre} "{grupo.seccion?.nombre}" - Año {grupo.anioEscolar}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(promedioPorPeriodo).map(([periodo, promedio]) => (
              <Card key={periodo}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{periodo}</p>
                      <h3 className={`text-2xl font-bold ${getCalificacionColor(promedio)}`}>{promedio}/100</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Calificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {calificaciones.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay calificaciones registradas</h3>
                  <p className="text-gray-500">Aún no tienes calificaciones registradas para este curso.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Descripción
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Calificación
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Periodo
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calificaciones.map((calificacion) => (
                        <tr key={calificacion.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{calificacion.descripcion}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getCalificacionColor(calificacion.valor)}`}>
                              {calificacion.valor}/100
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{calificacion.periodo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(calificacion.fecha).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
