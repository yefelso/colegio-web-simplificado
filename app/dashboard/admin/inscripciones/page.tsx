"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, doc, query, where, addDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { UserPlus, Search, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  email: string
  dni: string
}

interface Grado {
  id: string
  nombre: string
  nivel: string
}

interface Seccion {
  id: string
  nombre: string
}

interface Asignacion {
  id: string
  alumnoId: string
  gradoId: string
  seccionId: string
  anioEscolar: string
}

export default function InscripcionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [gradoSeleccionado, setGradoSeleccionado] = useState("")
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("")
  const [anioEscolar, setAnioEscolar] = useState(new Date().getFullYear().toString())
  const [seccionesFiltradas, setSeccionesFiltradas] = useState<Seccion[]>([])

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatos()
    }
  }, [user, router])

  useEffect(() => {
    if (gradoSeleccionado) {
      // Mostrar todas las secciones disponibles sin filtrar por gradoId
      setSeccionesFiltradas(secciones)
      setSeccionSeleccionada("")
    } else {
      setSeccionesFiltradas([])
      setSeccionSeleccionada("")
    }
  }, [gradoSeleccionado, secciones])

  useEffect(() => {
    if (busqueda.trim() === "") {
      setAlumnosFiltrados(alumnos)
    } else {
      const filtrados = alumnos.filter(
        (alumno) =>
          alumno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          alumno.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
          alumno.email.toLowerCase().includes(busqueda.toLowerCase()) ||
          alumno.dni.toLowerCase().includes(busqueda.toLowerCase()),
      )
      setAlumnosFiltrados(filtrados)
    }
  }, [busqueda, alumnos])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      console.log("Cargando datos para inscripciones...")

      // Cargar alumnos
      const alumnosQuery = query(collection(db, "users"), where("role", "==", "alumno"))
      const alumnosSnapshot = await getDocs(alumnosQuery)
      const alumnosData = alumnosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Alumno[]
      setAlumnos(alumnosData)
      setAlumnosFiltrados(alumnosData)
      console.log("Alumnos cargados:", alumnosData.length)

      // Cargar grados
      const gradosSnapshot = await getDocs(collection(db, "grados"))
      const gradosData = gradosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grado[]
      setGrados(gradosData)
      console.log("Grados cargados:", gradosData.length)

      // Cargar secciones
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seccion[]
      setSecciones(seccionesData)
      console.log("Secciones cargadas:", seccionesData.length)
      console.log("Secciones:", seccionesData)

      // Cargar asignaciones
      const asignacionesSnapshot = await getDocs(collection(db, "asignaciones"))
      const asignacionesData = asignacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asignacion[]
      setAsignaciones(asignacionesData)
      console.log("Asignaciones cargadas:", asignacionesData.length)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const inscribirAlumno = async (alumnoId: string) => {
    if (!gradoSeleccionado || !seccionSeleccionada || !anioEscolar) {
      toast({
        title: "Error",
        description: "Debes seleccionar un grado, sección y año escolar.",
        variant: "destructive",
      })
      return
    }

    // Verificar si el alumno ya está inscrito en el mismo grado y sección
    const yaInscrito = asignaciones.some(
      (asignacion) =>
        asignacion.alumnoId === alumnoId &&
        asignacion.gradoId === gradoSeleccionado &&
        asignacion.seccionId === seccionSeleccionada &&
        asignacion.anioEscolar === anioEscolar,
    )

    if (yaInscrito) {
      toast({
        title: "Error",
        description: "El alumno ya está inscrito en este grado y sección para el año escolar seleccionado.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Crear nueva asignación
      const nuevaAsignacion = {
        alumnoId,
        gradoId: gradoSeleccionado,
        seccionId: seccionSeleccionada,
        anioEscolar,
        fechaInscripcion: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, "asignaciones"), nuevaAsignacion)

      // Actualizar estado local
      setAsignaciones([...asignaciones, { id: docRef.id, ...nuevaAsignacion }])

      toast({
        title: "Inscripción exitosa",
        description: "El alumno ha sido inscrito correctamente.",
      })
    } catch (error) {
      console.error("Error al inscribir alumno:", error)
      toast({
        title: "Error",
        description: "No se pudo inscribir al alumno. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelarInscripcion = async (asignacionId: string) => {
    if (confirm("¿Estás seguro de cancelar esta inscripción? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        await deleteDoc(doc(db, "asignaciones", asignacionId))

        // Actualizar estado local
        setAsignaciones(asignaciones.filter((asignacion) => asignacion.id !== asignacionId))

        toast({
          title: "Inscripción cancelada",
          description: "La inscripción ha sido cancelada correctamente.",
        })
      } catch (error) {
        console.error("Error al cancelar inscripción:", error)
        toast({
          title: "Error",
          description: "No se pudo cancelar la inscripción. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const obtenerNombreGrado = (gradoId: string) => {
    const grado = grados.find((g) => g.id === gradoId)
    return grado ? grado.nombre : "Desconocido"
  }

  const obtenerNombreSeccion = (seccionId: string) => {
    const seccion = secciones.find((s) => s.id === seccionId)
    return seccion ? seccion.nombre : "Desconocida"
  }

  const obtenerAsignacionesAlumno = (alumnoId: string) => {
    return asignaciones.filter((asignacion) => asignacion.alumnoId === alumnoId)
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inscripción de Alumnos</h1>
        <p className="text-gray-500">Gestiona la inscripción de alumnos a grados y secciones.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Grado y Sección</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="grado">Grado</Label>
              <select
                id="grado"
                className="w-full rounded-md border border-gray-300 p-2"
                value={gradoSeleccionado}
                onChange={(e) => setGradoSeleccionado(e.target.value)}
              >
                <option value="">Seleccionar Grado</option>
                {grados.map((grado) => (
                  <option key={grado.id} value={grado.id}>
                    {grado.nombre} - {grado.nivel}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seccion">Sección</Label>
              <select
                id="seccion"
                className="w-full rounded-md border border-gray-300 p-2"
                value={seccionSeleccionada}
                onChange={(e) => setSeccionSeleccionada(e.target.value)}
                disabled={!gradoSeleccionado}
              >
                <option value="">Seleccionar Sección</option>
                {seccionesFiltradas.map((seccion) => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anioEscolar">Año Escolar</Label>
              <Input
                id="anioEscolar"
                type="number"
                value={anioEscolar}
                onChange={(e) => setAnioEscolar(e.target.value)}
                min={2020}
                max={2030}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="inscribir">
        <TabsList>
          <TabsTrigger value="inscribir">Inscribir Alumnos</TabsTrigger>
          <TabsTrigger value="inscritos">Alumnos Inscritos</TabsTrigger>
        </TabsList>

        <TabsContent value="inscribir" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alumnos Disponibles</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar alumno..."
                  className="pl-8"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : alumnosFiltrados.length === 0 ? (
                <div className="text-center py-6">
                  <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay alumnos disponibles</h3>
                  <p className="text-gray-500">No se encontraron alumnos que coincidan con tu búsqueda.</p>
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
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Inscripciones Actuales
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
                      {alumnosFiltrados.map((alumno) => {
                        const asignacionesAlumno = obtenerAsignacionesAlumno(alumno.id)
                        return (
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
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                {asignacionesAlumno.length === 0 ? (
                                  <span className="text-red-500">Sin inscripciones</span>
                                ) : (
                                  <ul className="list-disc pl-5">
                                    {asignacionesAlumno.map((asignacion) => (
                                      <li key={asignacion.id}>
                                        {obtenerNombreGrado(asignacion.gradoId)} "
                                        {obtenerNombreSeccion(asignacion.seccionId)}" - {asignacion.anioEscolar}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                onClick={() => inscribirAlumno(alumno.id)}
                                disabled={!gradoSeleccionado || !seccionSeleccionada || loading}
                                size="sm"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Inscribir
                              </Button>
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
        </TabsContent>

        <TabsContent value="inscritos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alumnos Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : asignaciones.length === 0 ? (
                <div className="text-center py-6">
                  <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay alumnos inscritos</h3>
                  <p className="text-gray-500">Aún no se han realizado inscripciones.</p>
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
                          Grado
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Sección
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Año Escolar
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
                      {asignaciones.map((asignacion) => {
                        const alumno = alumnos.find((a) => a.id === asignacion.alumnoId)
                        return (
                          <tr key={asignacion.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {alumno ? `${alumno.nombre} ${alumno.apellidos}` : "Alumno no encontrado"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{obtenerNombreGrado(asignacion.gradoId)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{obtenerNombreSeccion(asignacion.seccionId)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{asignacion.anioEscolar}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="destructive"
                                onClick={() => cancelarInscripcion(asignacion.id)}
                                disabled={loading}
                                size="sm"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
