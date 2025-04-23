"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where, addDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { Users, BookOpen, ArrowLeft, GraduationCap, UserCircle, PlusCircle, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  email: string
  dni: string
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
}

interface Seccion {
  id: string
  nombre: string
  gradoId?: string
}

interface GradoSeccion {
  id: string
  gradoId: string
  seccionId: string
  nombre: string
}

interface Asignacion {
  id: string
  alumnoId: string
  gradoId: string
  seccionId: string
  anioEscolar: string
}

interface Grupo {
  id: string
  gradoId: string
  seccionId: string
  gradoSeccionId?: string
  cursoId: string
  profesorId: string
  anioEscolar: string
}

interface Profesor {
  id: string
  nombre: string
  apellidos: string
  email: string
}

export default function DetalleGradoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const gradoId = params.gradoId as string

  const [loading, setLoading] = useState(true)
  const [grado, setGrado] = useState<any>(null)
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [seccionesAsignadas, setSeccionesAsignadas] = useState<Seccion[]>([])
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<Seccion[]>([])
  const [gradoSecciones, setGradoSecciones] = useState<GradoSeccion[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [todosLosAlumnos, setTodosLosAlumnos] = useState<Alumno[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [anioEscolar, setAnioEscolar] = useState(new Date().getFullYear().toString())
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("")
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [seccionDetalleId, setSeccionDetalleId] = useState<string | null>(null)
  const [alumnosSeccionDetalle, setAlumnosSeccionDetalle] = useState<Alumno[]>([])

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else if (user && gradoId) {
      cargarDatos()
    }
  }, [user, router, gradoId])

  const cargarDatos = async () => {
    if (!gradoId) return

    setLoading(true)
    try {
      console.log("Cargando datos para el grado:", gradoId)

      // Cargar información del grado
      const gradoDoc = await getDoc(doc(db, "grados", gradoId))
      if (!gradoDoc.exists()) {
        toast({
          title: "Error",
          description: "El grado especificado no existe.",
          variant: "destructive",
        })
        router.push("/dashboard/admin/administrar-grados")
        return
      }
      setGrado({ id: gradoDoc.id, ...gradoDoc.data() })

      // Cargar todas las secciones
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seccion[]
      setSecciones(seccionesData)

      // Cargar secciones asignadas al grado
      const gradoSeccionesRef = collection(db, "gradoSecciones")
      const gradoSeccionesQuery = query(gradoSeccionesRef, where("gradoId", "==", gradoId))
      const gradoSeccionesSnapshot = await getDocs(gradoSeccionesQuery)
      const gradoSeccionesData = gradoSeccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GradoSeccion[]
      setGradoSecciones(gradoSeccionesData)

      // Filtrar secciones asignadas y disponibles
      const seccionesAsignadasIds = gradoSeccionesData.map((gs) => gs.seccionId)
      const seccionesAsignadasData = seccionesData.filter((s) => seccionesAsignadasIds.includes(s.id))
      const seccionesDisponiblesData = seccionesData.filter((s) => !seccionesAsignadasIds.includes(s.id))

      setSeccionesAsignadas(seccionesAsignadasData)
      setSeccionesDisponibles(seccionesDisponiblesData)

      // Cargar todos los alumnos
      const alumnosQuery = query(collection(db, "users"), where("role", "==", "alumno"))
      const alumnosSnapshot = await getDocs(alumnosQuery)
      const alumnosData = alumnosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Alumno[]
      setTodosLosAlumnos(alumnosData)

      // Cargar asignaciones del grado
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(asignacionesRef, where("gradoId", "==", gradoId))
      const asignacionesSnapshot = await getDocs(asignacionesQuery)
      const asignacionesData = asignacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asignacion[]
      setAsignaciones(asignacionesData)

      // Cargar alumnos asignados
      if (asignacionesData.length > 0) {
        const alumnosIds = [...new Set(asignacionesData.map((a) => a.alumnoId))]
        const alumnosAsignados = alumnosData.filter((a) => alumnosIds.includes(a.id))
        setAlumnos(alumnosAsignados)
      }

      // Cargar cursos
      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[]
      setCursos(cursosData)

      // Cargar grupos del grado
      const gruposRef = collection(db, "grupos")
      const gruposQuery = query(gruposRef, where("gradoId", "==", gradoId))
      const gruposSnapshot = await getDocs(gruposQuery)
      const gruposData = gruposSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grupo[]
      setGrupos(gruposData)

      // Cargar profesores
      if (gruposData.length > 0) {
        const profesoresIds = [...new Set(gruposData.map((g) => g.profesorId))]
        const profesoresPromises = profesoresIds.map(async (id) => {
          try {
            const userDoc = await getDoc(doc(db, "users", id))
            if (userDoc.exists()) {
              return {
                id: userDoc.id,
                ...userDoc.data(),
              }
            }
            return null
          } catch (error) {
            console.error("Error al cargar profesor:", id, error)
            return null
          }
        })

        const profesoresData = (await Promise.all(profesoresPromises)).filter(
          (profesor): profesor is Profesor => profesor !== null,
        ) as Profesor[]
        setProfesores(profesoresData)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del grado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const asignarSeccion = async () => {
    if (!seccionSeleccionada) {
      toast({
        title: "Error",
        description: "Debes seleccionar una sección para asignar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Obtener el nombre de la sección
      const seccion = secciones.find((s) => s.id === seccionSeleccionada)
      if (!seccion) {
        throw new Error("Sección no encontrada")
      }

      // Crear la relación grado-sección
      const gradoSeccionRef = await addDoc(collection(db, "gradoSecciones"), {
        gradoId,
        seccionId: seccionSeleccionada,
        nombre: `${grado.nombre} - ${seccion.nombre}`,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Sección asignada",
        description: "La sección ha sido asignada correctamente al grado.",
      })

      // Actualizar la sección con el gradoId
      await updateDoc(doc(db, "secciones", seccionSeleccionada), {
        gradoId,
      })

      // Recargar datos
      cargarDatos()
      setSeccionSeleccionada("")
      setDialogOpen(false)
    } catch (error) {
      console.error("Error al asignar sección:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar la sección al grado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const asignarAlumno = async () => {
    if (!alumnoSeleccionado || !seccionSeleccionada) {
      toast({
        title: "Error",
        description: "Debes seleccionar un alumno y una sección.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Verificar si el alumno ya está asignado a este grado y sección
      const asignacionExistente = asignaciones.find(
        (a) =>
          a.alumnoId === alumnoSeleccionado &&
          a.gradoId === gradoId &&
          a.seccionId === seccionSeleccionada &&
          a.anioEscolar === anioEscolar,
      )

      if (asignacionExistente) {
        toast({
          title: "Error",
          description: "El alumno ya está asignado a esta sección para el año escolar actual.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Crear la asignación
      await addDoc(collection(db, "asignaciones"), {
        alumnoId: alumnoSeleccionado,
        gradoId,
        seccionId: seccionSeleccionada,
        anioEscolar,
        fechaInscripcion: new Date().toISOString(),
      })

      toast({
        title: "Alumno asignado",
        description: "El alumno ha sido asignado correctamente a la sección.",
      })

      // Recargar datos
      cargarDatos()
      setAlumnoSeleccionado("")
    } catch (error) {
      console.error("Error al asignar alumno:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar el alumno a la sección.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const obtenerNombreSeccion = (seccionId: string) => {
    const seccion = secciones.find((s) => s.id === seccionId)
    return seccion ? seccion.nombre : "Desconocida"
  }

  const obtenerNombreCurso = (cursoId: string) => {
    const curso = cursos.find((c) => c.id === cursoId)
    return curso ? curso.nombre : "Desconocido"
  }

  const obtenerNombreProfesor = (profesorId: string) => {
    const profesor = profesores.find((p) => p.id === profesorId)
    return profesor ? `${profesor.nombre} ${profesor.apellidos}` : "Desconocido"
  }

  const filtrarAlumnosPorSeccion = (seccionId: string) => {
    const asignacionesSeccion = asignaciones.filter((a) => a.seccionId === seccionId && a.anioEscolar === anioEscolar)
    return alumnos.filter((alumno) => asignacionesSeccion.some((a) => a.alumnoId === alumno.id))
  }

  const filtrarGruposPorSeccion = (seccionId: string) => {
    return grupos.filter((g) => g.seccionId === seccionId && g.anioEscolar === anioEscolar)
  }

  const verDetallesSeccion = (seccionId: string) => {
    setSeccionDetalleId(seccionId)
    const alumnosSeccion = filtrarAlumnosPorSeccion(seccionId)
    setAlumnosSeccionDetalle(alumnosSeccion)
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => router.push("/dashboard/admin/administrar-grados")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Administrar Grados
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{grado?.nombre || "Cargando..."}</h1>
          <p className="text-gray-500">Nivel: {grado?.nivel || "..."}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Alumnos</p>
                <h3 className="text-2xl font-bold">{alumnos.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Secciones</p>
                <h3 className="text-2xl font-bold">{seccionesAsignadas.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cursos</p>
                <h3 className="text-2xl font-bold">{grupos.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <UserCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Profesores</p>
                <h3 className="text-2xl font-bold">{profesores.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <select
          className="rounded-md border border-gray-300 p-2"
          value={anioEscolar}
          onChange={(e) => setAnioEscolar(e.target.value)}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
            <option key={year} value={year.toString()}>
              Año Escolar {year}
            </option>
          ))}
        </select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Asignar Sección
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Sección al Grado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="seccion">Seleccionar Sección</Label>
                <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {seccionesDisponibles.map((seccion) => (
                      <SelectItem key={seccion.id} value={seccion.id}>
                        Sección {seccion.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={asignarSeccion} disabled={loading || !seccionSeleccionada} className="w-full">
                {loading ? "Asignando..." : "Asignar Sección"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="secciones">
        <TabsList>
          <TabsTrigger value="secciones">Secciones</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="profesores">Profesores</TabsTrigger>
        </TabsList>

        <TabsContent value="secciones" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : seccionesAsignadas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay secciones</h3>
                <p className="text-gray-500 mb-4">Este grado no tiene secciones asignadas.</p>
                <Button onClick={() => setDialogOpen(true)}>Asignar Sección</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {seccionesAsignadas.map((seccion) => {
                const alumnosSeccion = filtrarAlumnosPorSeccion(seccion.id)
                const gruposSeccion = filtrarGruposPorSeccion(seccion.id)
                const gradoSeccion = gradoSecciones.find((gs) => gs.seccionId === seccion.id)

                return (
                  <Card key={seccion.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Sección "{seccion.nombre}"</span>
                        <Button variant="outline" size="sm" onClick={() => verDetallesSeccion(seccion.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Detalles
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-md">
                            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm text-gray-500">Alumnos</p>
                            <p className="text-xl font-bold">{alumnosSeccion.length}</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-md">
                            <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm text-gray-500">Cursos</p>
                            <p className="text-xl font-bold">{gruposSeccion.length}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>
                            <strong>ID Grado-Sección:</strong> {gradoSeccion?.id || "No disponible"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => {
                              setSeccionSeleccionada(seccion.id)
                              const tab = document.querySelector('[data-value="alumnos"]') as HTMLElement
                              if (tab) tab.click()
                            }}
                          >
                            Ver Alumnos
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alumnos" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : seccionesAsignadas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay secciones asignadas</h3>
                <p className="text-gray-500 mb-4">Primero debes asignar secciones a este grado.</p>
                <Button onClick={() => setDialogOpen(true)}>Asignar Sección</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asignar Alumno a Sección</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="alumno">Seleccionar Alumno</Label>
                      <Select value={alumnoSeleccionado} onValueChange={setAlumnoSeleccionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar alumno" />
                        </SelectTrigger>
                        <SelectContent>
                          {todosLosAlumnos.map((alumno) => (
                            <SelectItem key={alumno.id} value={alumno.id}>
                              {alumno.nombre} {alumno.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seccion">Seleccionar Sección</Label>
                      <Select value={seccionSeleccionada} onValueChange={setSeccionSeleccionada}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sección" />
                        </SelectTrigger>
                        <SelectContent>
                          {seccionesAsignadas.map((seccion) => (
                            <SelectItem key={seccion.id} value={seccion.id}>
                              Sección {seccion.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={asignarAlumno} disabled={loading || !alumnoSeleccionado || !seccionSeleccionada}>
                    {loading ? "Asignando..." : "Asignar Alumno"}
                  </Button>
                </CardContent>
              </Card>

              {seccionDetalleId ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Alumnos - Sección "{obtenerNombreSeccion(seccionDetalleId)}"</span>
                      <Button variant="outline" size="sm" onClick={() => setSeccionDetalleId(null)}>
                        Ver todas las secciones
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alumnosSeccionDetalle.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No hay alumnos asignados a esta sección.</p>
                    ) : (
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Nombre
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                DNI
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Email
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {alumnosSeccionDetalle.map((alumno) => (
                              <tr key={alumno.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {alumno.nombre} {alumno.apellidos}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{alumno.dni}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{alumno.email}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                seccionesAsignadas.map((seccion) => {
                  const alumnosSeccion = filtrarAlumnosPorSeccion(seccion.id)
                  if (alumnosSeccion.length === 0) return null

                  return (
                    <Card key={seccion.id}>
                      <CardHeader>
                        <CardTitle>Alumnos - Sección "{seccion.nombre}"</CardTitle>
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
                                  Nombre
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  DNI
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Email
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {alumnosSeccion.map((alumno) => (
                                <tr key={alumno.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {alumno.nombre} {alumno.apellidos}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{alumno.dni}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{alumno.email}</div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cursos" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : grupos.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay cursos asignados</h3>
                <p className="text-gray-500 mb-4">
                  Este grado no tiene cursos asignados para el año escolar seleccionado.
                </p>
                <Button onClick={() => router.push("/dashboard/admin/grupos")}>Gestionar Grupos</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {seccionesAsignadas.map((seccion) => {
                const gruposSeccion = filtrarGruposPorSeccion(seccion.id)
                if (gruposSeccion.length === 0) return null

                return (
                  <Card key={seccion.id}>
                    <CardHeader>
                      <CardTitle>Cursos - Sección "{seccion.nombre}"</CardTitle>
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
                                Curso
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Profesor
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Año Escolar
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {gruposSeccion.map((grupo) => (
                              <tr key={grupo.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {obtenerNombreCurso(grupo.cursoId)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{obtenerNombreProfesor(grupo.profesorId)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{grupo.anioEscolar}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profesores" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : profesores.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <UserCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay profesores asignados</h3>
                <p className="text-gray-500 mb-4">
                  Este grado no tiene profesores asignados para el año escolar seleccionado.
                </p>
                <Button onClick={() => router.push("/dashboard/admin/grupos")}>Gestionar Grupos</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profesores Asignados</CardTitle>
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
                            Nombre
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Cursos Asignados
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {profesores.map((profesor) => {
                          const cursosPorProfesor = grupos.filter((g) => g.profesorId === profesor.id)
                          return (
                            <tr key={profesor.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {profesor.nombre} {profesor.apellidos}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{profesor.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {cursosPorProfesor.map((g) => obtenerNombreCurso(g.cursoId)).join(", ")}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
