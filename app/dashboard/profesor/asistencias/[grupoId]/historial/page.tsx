"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, query, where, getDoc, doc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Asistencia } from "@/lib/models/asistencia"

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
}

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  dni: string
  asistencias: {
    presentes: number
    ausentes: number
    tardanzas: number
    total: number
    porcentaje: number
  }
}

export default function HistorialAsistenciasPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const grupoId = params.grupoId as string

  const [loading, setLoading] = useState(false)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [fechas, setFechas] = useState<string[]>([])
  const [asistenciasPorFecha, setAsistenciasPorFecha] = useState<Record<string, Asistencia[]>>({})
  const [activeTab, setActiveTab] = useState("resumen")

  useEffect(() => {
    if (user && user.role !== "profesor") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatos()
    }
  }, [user, router, grupoId])

  const cargarDatos = async () => {
    if (!user || !grupoId) return

    setLoading(true)
    try {
      // Verificar que el grupo pertenece al profesor
      const grupoDoc = await getDoc(doc(db, "grupos", grupoId))

      if (!grupoDoc.exists() || grupoDoc.data().profesorId !== user.uid) {
        toast({
          title: "Error",
          description: "No tienes acceso a este grupo.",
          variant: "destructive",
        })
        router.push("/dashboard/profesor/asistencias")
        return
      }

      const grupoData = grupoDoc.data()
      const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
      const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
      const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))

      setGrupo({
        id: grupoDoc.id,
        ...grupoData,
        grado: gradoDoc.exists() ? gradoDoc.data() : undefined,
        seccion: seccionDoc.exists() ? seccionDoc.data() : undefined,
        curso: cursoDoc.exists() ? cursoDoc.data() : undefined,
      } as Grupo)

      // Obtener alumnos asignados al grupo
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(
        asignacionesRef,
        where("gradoId", "==", grupoData.gradoId),
        where("seccionId", "==", grupoData.seccionId),
      )
      const asignacionesSnapshot = await getDocs(asignacionesQuery)

      if (asignacionesSnapshot.empty) {
        setAlumnos([])
        setLoading(false)
        return
      }

      // Obtener asistencias del grupo
      const asistenciasRef = collection(db, "asistencias")
      const asistenciasQuery = query(
        asistenciasRef,
        where("grupoId", "==", grupoId),
        where("tipo", "==", "curso"),
        orderBy("fecha", "desc"),
      )
      const asistenciasSnapshot = await getDocs(asistenciasQuery)

      const asistencias = asistenciasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asistencia[]

      // Agrupar asistencias por fecha
      const asistenciasPorFechaObj: Record<string, Asistencia[]> = {}
      const fechasSet = new Set<string>()

      asistencias.forEach((asistencia) => {
        if (!asistenciasPorFechaObj[asistencia.fecha]) {
          asistenciasPorFechaObj[asistencia.fecha] = []
        }
        asistenciasPorFechaObj[asistencia.fecha].push(asistencia)
        fechasSet.add(asistencia.fecha)
      })

      setAsistenciasPorFecha(asistenciasPorFechaObj)
      setFechas(Array.from(fechasSet).sort().reverse())

      // Obtener datos de los alumnos y calcular estadísticas
      const alumnosData: Alumno[] = []

      for (const asignacionDoc of asignacionesSnapshot.docs) {
        const asignacion = asignacionDoc.data()
        const alumnoDoc = await getDoc(doc(db, "users", asignacion.alumnoId))

        if (alumnoDoc.exists() && alumnoDoc.data().role === "alumno") {
          const alumnoData = alumnoDoc.data()
          const alumnoId = alumnoDoc.id

          // Calcular estadísticas de asistencia para este alumno
          const asistenciasAlumno = asistencias.filter((a) => a.alumnoId === alumnoId)
          const presentes = asistenciasAlumno.filter((a) => a.estado === "presente").length
          const ausentes = asistenciasAlumno.filter((a) => a.estado === "ausente").length
          const tardanzas = asistenciasAlumno.filter((a) => a.estado === "tardanza").length
          const total = asistenciasAlumno.length
          const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0

          alumnosData.push({
            id: alumnoId,
            nombre: alumnoData.nombre,
            apellidos: alumnoData.apellidos,
            dni: alumnoData.dni,
            asistencias: {
              presentes,
              ausentes,
              tardanzas,
              total,
              porcentaje,
            },
          })
        }
      }

      // Ordenar alumnos por apellido
      alumnosData.sort((a, b) => a.apellidos.localeCompare(b.apellidos))

      setAlumnos(alumnosData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del historial de asistencias.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "presente":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "ausente":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "tardanza":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case "presente":
        return "Presente"
      case "ausente":
        return "Ausente"
      case "tardanza":
        return "Tardanza"
      default:
        return ""
    }
  }

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case "presente":
        return "bg-green-100 text-green-800"
      case "ausente":
        return "bg-red-100 text-red-800"
      case "tardanza":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportarAsistencias = () => {
    if (!grupo || !alumnos.length) return

    try {
      // Crear datos CSV
      let csv = "Apellidos,Nombre,DNI,Presentes,Ausentes,Tardanzas,Total,Porcentaje\n"

      alumnos.forEach((alumno) => {
        csv += `${alumno.apellidos},${alumno.nombre},${alumno.dni},${alumno.asistencias.presentes},${alumno.asistencias.ausentes},${alumno.asistencias.tardanzas},${alumno.asistencias.total},${alumno.asistencias.porcentaje}%\n`
      })

      // Crear blob y descargar
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `asistencias_${grupo.curso?.nombre}_${grupo.grado?.nombre}_${grupo.seccion?.nombre}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al exportar asistencias:", error)
      toast({
        title: "Error",
        description: "No se pudieron exportar las asistencias.",
        variant: "destructive",
      })
    }
  }

  if (user?.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/profesor/asistencias">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Asistencias</h1>
            {grupo && (
              <p className="text-gray-500">
                {grupo.curso?.nombre} - {grupo.grado?.nombre} "{grupo.seccion?.nombre}"
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={exportarAsistencias}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : alumnos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No hay datos de asistencia</h3>
            <p className="text-gray-500 text-center max-w-md">
              No se encontraron registros de asistencia para este grupo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="fechas">Por Fechas</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Asistencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Alumno
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Presentes
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Ausentes
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tardanzas
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          % Asistencia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alumnos.map((alumno) => (
                        <tr key={alumno.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {alumno.apellidos}, {alumno.nombre}
                            </div>
                            <div className="text-sm text-gray-500">{alumno.dni}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-600 font-medium">{alumno.asistencias.presentes}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-red-600 font-medium">{alumno.asistencias.ausentes}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-yellow-600 font-medium">{alumno.asistencias.tardanzas}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                alumno.asistencias.porcentaje >= 90
                                  ? "bg-green-100 text-green-800"
                                  : alumno.asistencias.porcentaje >= 75
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {alumno.asistencias.porcentaje}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fechas" className="mt-6">
            <div className="space-y-6">
              {fechas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay registros de asistencia</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      No se encontraron registros de asistencia para este grupo.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                fechas.map((fecha) => (
                  <Card key={fecha}>
                    <CardHeader>
                      <CardTitle>
                        {new Date(fecha).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Alumno
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Estado
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Hora
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Observaciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {asistenciasPorFecha[fecha]?.map((asistencia) => (
                              <tr key={asistencia.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{asistencia.alumnoNombre}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {getEstadoIcon(asistencia.estado)}
                                    <span
                                      className={`ml-1 px-2 py-1 text-xs rounded-full ${getEstadoClass(asistencia.estado)}`}
                                    >
                                      {getEstadoText(asistencia.estado)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{asistencia.hora}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-500">{asistencia.observaciones || "-"}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
