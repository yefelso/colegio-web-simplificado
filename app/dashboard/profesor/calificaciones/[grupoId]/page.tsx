"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where, addDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { Save, Plus, FileText, Check, AlertTriangle, Clock } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  email: string
}

interface Calificacion {
  id?: string
  alumnoId: string
  grupoId: string
  valor: number
  descripcion: string
  fecha: string
  periodo: string
  tipo: "academica" | "actitud" | "comportamiento" | "asistencia"
  publicada: boolean
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
}

const periodos = [
  { valor: "1er_semestre", nombre: "1er Semestre" },
  { valor: "2do_semestre", nombre: "2do Semestre" },
  { valor: "3er_semestre", nombre: "3er Semestre" },
  { valor: "4to_semestre", nombre: "4to Semestre" },
  { valor: "final", nombre: "Calificación Final" },
]

const tiposCalificacion = [
  { valor: "academica", nombre: "Académica" },
  { valor: "actitud", nombre: "Actitud" },
  { valor: "comportamiento", nombre: "Comportamiento" },
  { valor: "asistencia", nombre: "Asistencia" },
]

export default function CalificacionesGrupoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const grupoId = params.grupoId as string

  const [loading, setLoading] = useState(false)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([])
  const [periodoActivo, setPeriodoActivo] = useState(periodos[0].valor)
  const [tipoCalificacion, setTipoCalificacion] = useState<"academica" | "actitud" | "comportamiento" | "asistencia">(
    "academica",
  )
  const [nuevaCalificacion, setNuevaCalificacion] = useState<Omit<Calificacion, "id">>({
    alumnoId: "",
    grupoId,
    valor: 0,
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    periodo: periodos[0].valor,
    tipo: "academica",
    publicada: false,
  })
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [calificacionesEditadas, setCalificacionesEditadas] = useState<Record<string, number>>({})

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
        router.push("/dashboard/profesor/grupos")
        return
      }

      // Obtener información del grupo
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
      const asignacionesQuery = query(asignacionesRef, where("grupoId", "==", grupoId))
      const asignacionesSnapshot = await getDocs(asignacionesQuery)

      if (asignacionesSnapshot.empty) {
        setAlumnos([])
      } else {
        const alumnosIds = asignacionesSnapshot.docs.map((doc) => doc.data().alumnoId)

        // Obtener información de cada alumno
        const alumnosPromises = alumnosIds.map(async (alumnoId) => {
          const alumnoDoc = await getDoc(doc(db, "users", alumnoId))
          if (alumnoDoc.exists()) {
            return {
              id: alumnoDoc.id,
              ...alumnoDoc.data(),
            } as Alumno
          }
          return null
        })

        const alumnosData = (await Promise.all(alumnosPromises)).filter(Boolean) as Alumno[]
        setAlumnos(alumnosData)
      }

      // Obtener calificaciones del grupo
      const calificacionesRef = collection(db, "calificaciones")
      const calificacionesQuery = query(calificacionesRef, where("grupoId", "==", grupoId))
      const calificacionesSnapshot = await getDocs(calificacionesQuery)

      if (calificacionesSnapshot.empty) {
        setCalificaciones([])
      } else {
        const calificacionesData = calificacionesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Calificacion[]
        setCalificaciones(calificacionesData)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del grupo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeCalificacion = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setNuevaCalificacion((prev) => ({
      ...prev,
      [name]: name === "valor" ? Number.parseFloat(value) : value,
      tipo: tipoCalificacion,
      periodo: periodoActivo,
    }))
  }

  const guardarCalificacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !grupoId) return

    if (!nuevaCalificacion.alumnoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un alumno.",
        variant: "destructive",
      })
      return
    }

    if (nuevaCalificacion.valor < 0 || nuevaCalificacion.valor > 100) {
      toast({
        title: "Error",
        description: "La calificación debe estar entre 0 y 100.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Guardar la calificación
      await addDoc(collection(db, "calificaciones"), {
        alumnoId: nuevaCalificacion.alumnoId,
        grupoId,
        valor: nuevaCalificacion.valor,
        descripcion: nuevaCalificacion.descripcion,
        fecha: nuevaCalificacion.fecha,
        periodo: nuevaCalificacion.periodo,
        tipo: nuevaCalificacion.tipo,
        publicada: false,
        profesorId: user.uid,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Calificación guardada",
        description: "La calificación ha sido guardada correctamente.",
      })

      // Resetear el formulario
      setNuevaCalificacion({
        alumnoId: "",
        grupoId,
        valor: 0,
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        periodo: periodoActivo,
        tipo: tipoCalificacion,
        publicada: false,
      })

      setMostrarFormulario(false)

      // Recargar las calificaciones
      cargarDatos()
    } catch (error) {
      console.error("Error al guardar calificación:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la calificación. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCalificacionChange = (calificacionId: string, nuevoValor: number) => {
    setCalificacionesEditadas((prev) => ({
      ...prev,
      [calificacionId]: nuevoValor,
    }))
  }

  const actualizarCalificacion = async (calificacionId: string) => {
    if (!user || !grupoId || !calificacionesEditadas[calificacionId]) return

    const nuevoValor = calificacionesEditadas[calificacionId]

    if (nuevoValor < 0 || nuevoValor > 100) {
      toast({
        title: "Error",
        description: "La calificación debe estar entre 0 y 100.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Actualizar la calificación
      await updateDoc(doc(db, "calificaciones", calificacionId), {
        valor: nuevoValor,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Calificación actualizada",
        description: "La calificación ha sido actualizada correctamente.",
      })

      // Actualizar el estado local
      setCalificaciones(calificaciones.map((cal) => (cal.id === calificacionId ? { ...cal, valor: nuevoValor } : cal)))

      // Limpiar calificaciones editadas
      const { [calificacionId]: _, ...rest } = calificacionesEditadas
      setCalificacionesEditadas(rest)
    } catch (error) {
      console.error("Error al actualizar calificación:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la calificación. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const publicarCalificaciones = async () => {
    if (!user || !grupoId) return

    // Filtrar calificaciones del periodo y tipo actuales
    const calificacionesFiltradas = calificaciones.filter(
      (c) => c.periodo === periodoActivo && c.tipo === tipoCalificacion && !c.publicada,
    )

    if (calificacionesFiltradas.length === 0) {
      toast({
        title: "Información",
        description: "No hay calificaciones pendientes por publicar para este periodo y tipo.",
      })
      return
    }

    if (
      !confirm(
        `¿Estás seguro de publicar todas las calificaciones de ${
          tiposCalificacion.find((t) => t.valor === tipoCalificacion)?.nombre
        } para el ${periodos.find((p) => p.valor === periodoActivo)?.nombre}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    setLoading(true)
    try {
      // Actualizar todas las calificaciones del periodo y tipo
      const actualizacionesPromises = calificacionesFiltradas.map((calificacion) => {
        if (!calificacion.id) return Promise.resolve()
        return updateDoc(doc(db, "calificaciones", calificacion.id), {
          publicada: true,
          fechaPublicacion: new Date().toISOString(),
        })
      })

      await Promise.all(actualizacionesPromises)

      toast({
        title: "Calificaciones publicadas",
        description: "Las calificaciones han sido publicadas correctamente.",
      })

      // Actualizar el estado local
      setCalificaciones(
        calificaciones.map((cal) =>
          cal.periodo === periodoActivo && cal.tipo === tipoCalificacion ? { ...cal, publicada: true } : cal,
        ),
      )
    } catch (error) {
      console.error("Error al publicar calificaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron publicar las calificaciones. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filtrarCalificaciones = () => {
    return calificaciones.filter((c) => c.periodo === periodoActivo && c.tipo === tipoCalificacion)
  }

  const obtenerCalificacionAlumno = (alumnoId: string) => {
    const calificacionesAlumno = filtrarCalificaciones().filter((c) => c.alumnoId === alumnoId)
    return calificacionesAlumno.length > 0 ? calificacionesAlumno[0] : null
  }

  const calcularPromedioAlumno = (alumnoId: string) => {
    const calificacionesAlumno = calificaciones.filter(
      (c) => c.alumnoId === alumnoId && c.tipo === "academica" && c.publicada,
    )
    if (calificacionesAlumno.length === 0) return "-"
    const suma = calificacionesAlumno.reduce((acc, cal) => acc + cal.valor, 0)
    return (suma / calificacionesAlumno.length).toFixed(1)
  }

  if (user?.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Calificaciones</h1>
        {grupo && (
          <p className="text-gray-500">
            {grupo.grado?.nombre} "{grupo.seccion?.nombre}" - {grupo.curso?.nombre} - Año {grupo.anioEscolar}
          </p>
        )}
      </div>

      {loading && !grupo ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Tabs
              value={tipoCalificacion}
              onValueChange={(value) => setTipoCalificacion(value as any)}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-2 md:grid-cols-4">
                {tiposCalificacion.map((tipo) => (
                  <TabsTrigger key={tipo.valor} value={tipo.valor}>
                    {tipo.nombre}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex gap-4">
              <select
                className="rounded-md border border-gray-300 p-2"
                value={periodoActivo}
                onChange={(e) => setPeriodoActivo(e.target.value)}
              >
                {periodos.map((periodo) => (
                  <option key={periodo.valor} value={periodo.valor}>
                    {periodo.nombre}
                  </option>
                ))}
              </select>

              <Button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                {mostrarFormulario ? (
                  "Cancelar"
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Calificación
                  </>
                )}
              </Button>
            </div>
          </div>

          {mostrarFormulario && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Registrar Nueva Calificación - {tiposCalificacion.find((t) => t.valor === tipoCalificacion)?.nombre} -{" "}
                  {periodos.find((p) => p.valor === periodoActivo)?.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={guardarCalificacion} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="alumnoId">Alumno</Label>
                      <select
                        id="alumnoId"
                        name="alumnoId"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={nuevaCalificacion.alumnoId}
                        onChange={handleChangeCalificacion}
                        required
                      >
                        <option value="">Seleccionar Alumno</option>
                        {alumnos.map((alumno) => (
                          <option key={alumno.id} value={alumno.id}>
                            {alumno.nombre} {alumno.apellidos}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Calificación (0-100)</Label>
                      <Input
                        id="valor"
                        name="valor"
                        type="number"
                        min="0"
                        max="100"
                        value={nuevaCalificacion.valor}
                        onChange={handleChangeCalificacion}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        name="fecha"
                        type="date"
                        value={nuevaCalificacion.fecha}
                        onChange={handleChangeCalificacion}
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <textarea
                        id="descripcion"
                        name="descripcion"
                        className="w-full rounded-md border border-gray-300 p-2"
                        rows={3}
                        value={nuevaCalificacion.descripcion}
                        onChange={handleChangeCalificacion}
                        placeholder="Examen parcial, trabajo práctico, etc."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? "Guardando..." : "Guardar Calificación"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Calificaciones de {tiposCalificacion.find((t) => t.valor === tipoCalificacion)?.nombre} -{" "}
                {periodos.find((p) => p.valor === periodoActivo)?.nombre}
              </CardTitle>
              <Button onClick={publicarCalificaciones} disabled={loading}>
                <Check className="mr-2 h-4 w-4" />
                Publicar Calificaciones
              </Button>
            </CardHeader>
            <CardContent>
              {alumnos.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay alumnos asignados</h3>
                  <p className="text-gray-500">
                    Este grupo no tiene alumnos asignados. Contacta con el administrador para asignar alumnos.
                  </p>
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
                          Alumno
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
                          Estado
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Promedio
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alumnos.map((alumno) => {
                        const calificacion = obtenerCalificacionAlumno(alumno.id)
                        const promedio = calcularPromedioAlumno(alumno.id)
                        return (
                          <tr key={alumno.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {alumno.nombre} {alumno.apellidos}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {calificacion ? (
                                <input
                                  type="number"
                                  className="w-16 rounded-md border border-gray-300 p-1 text-center"
                                  min="0"
                                  max="100"
                                  value={
                                    calificacionesEditadas[calificacion.id as string] !== undefined
                                      ? calificacionesEditadas[calificacion.id as string]
                                      : calificacion.valor
                                  }
                                  onChange={(e) => {
                                    if (calificacion.id) {
                                      handleCalificacionChange(calificacion.id, Number.parseFloat(e.target.value))
                                    }
                                  }}
                                  disabled={calificacion.publicada}
                                />
                              ) : (
                                <span className="text-gray-500">No registrada</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {calificacion ? (
                                calificacion.publicada ? (
                                  <div className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600">Publicada</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="text-sm text-yellow-600">Pendiente</span>
                                  </div>
                                )
                              ) : (
                                <div className="flex items-center">
                                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                  <span className="text-sm text-red-600">Sin calificar</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">{promedio}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {calificacion &&
                                !calificacion.publicada &&
                                calificacionesEditadas[calificacion.id as string] !== undefined && (
                                  <Button
                                    size="sm"
                                    onClick={() => actualizarCalificacion(calificacion.id as string)}
                                    disabled={loading}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                )}
                            </td>
                          </tr>
                        )
                      })}
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
