"use client"

import type React from "react"

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
import { Clock, Save, Plus, Trash2, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Profesor {
  id: string
  nombre: string
  apellidos: string
  email: string
}

interface Horario {
  id: string
  profesorId: string
  dia: string
  horaInicio: string
  horaFin: string
  cursoId?: string
  gradoId?: string
  seccionId?: string
  aula?: string
  anioEscolar: string
}

interface Curso {
  id: string
  nombre: string
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

const diasSemana = [
  { valor: "lunes", nombre: "Lunes" },
  { valor: "martes", nombre: "Martes" },
  { valor: "miercoles", nombre: "Miércoles" },
  { valor: "jueves", nombre: "Jueves" },
  { valor: "viernes", nombre: "Viernes" },
  { valor: "sabado", nombre: "Sábado" },
]

export default function HorariosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [profesoresFiltrados, setProfesoresFiltrados] = useState<Profesor[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [profesorSeleccionado, setProfesorSeleccionado] = useState("")
  const [anioEscolar, setAnioEscolar] = useState(new Date().getFullYear().toString())
  const [nuevoHorario, setNuevoHorario] = useState<Omit<Horario, "id">>({
    profesorId: "",
    dia: "lunes",
    horaInicio: "08:00",
    horaFin: "09:00",
    anioEscolar: new Date().getFullYear().toString(),
  })
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [seccionesFiltradas, setSeccionesFiltradas] = useState<Seccion[]>([])

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatos()
    }
  }, [user, router])

  useEffect(() => {
    if (busqueda.trim() === "") {
      setProfesoresFiltrados(profesores)
    } else {
      const filtrados = profesores.filter(
        (profesor) =>
          profesor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          profesor.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
          profesor.email.toLowerCase().includes(busqueda.toLowerCase()),
      )
      setProfesoresFiltrados(filtrados)
    }
  }, [busqueda, profesores])

  useEffect(() => {
    if (nuevoHorario.gradoId) {
      console.log("Filtrando secciones para el grado:", nuevoHorario.gradoId)
      console.log("Todas las secciones disponibles:", secciones)
      // Ya no filtramos por gradoId, mostramos todas las secciones
      setSeccionesFiltradas(secciones)
    } else {
      setSeccionesFiltradas([])
    }
  }, [nuevoHorario.gradoId, secciones])

  useEffect(() => {
    if (profesorSeleccionado) {
      setNuevoHorario((prev) => ({ ...prev, profesorId: profesorSeleccionado }))
    }
  }, [profesorSeleccionado])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      console.log("Cargando datos para horarios...")

      // Cargar profesores
      const profesoresQuery = query(collection(db, "users"), where("role", "==", "profesor"))
      const profesoresSnapshot = await getDocs(profesoresQuery)
      const profesoresData = profesoresSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Profesor[]
      setProfesores(profesoresData)
      setProfesoresFiltrados(profesoresData)
      console.log("Profesores cargados:", profesoresData.length)

      // Cargar cursos
      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[]
      setCursos(cursosData)
      console.log("Cursos cargados:", cursosData.length)

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
      console.log("Secciones cargadas:", seccionesData)

      // Cargar horarios
      const horariosSnapshot = await getDocs(collection(db, "horarios"))
      const horariosData = horariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Horario[]
      setHorarios(horariosData)
      console.log("Horarios cargados:", horariosData.length)
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

  const cargarHorariosProfesor = async (profesorId: string) => {
    if (!profesorId) return

    setLoading(true)
    try {
      const horariosQuery = query(
        collection(db, "horarios"),
        where("profesorId", "==", profesorId),
        where("anioEscolar", "==", anioEscolar),
      )
      const horariosSnapshot = await getDocs(horariosQuery)
      const horariosData = horariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Horario[]
      setHorarios(horariosData)
      console.log("Horarios del profesor cargados:", horariosData.length)
    } catch (error) {
      console.error("Error al cargar horarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios del profesor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeNuevoHorario = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNuevoHorario((prev) => ({ ...prev, [name]: value }))

    // Si se selecciona un grado, actualizar las secciones filtradas
    if (name === "gradoId") {
      console.log("Grado seleccionado:", value)
      if (value) {
        setSeccionesFiltradas(secciones)
      } else {
        setSeccionesFiltradas([])
      }
    }
  }

  const guardarHorario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoHorario.profesorId || !nuevoHorario.dia || !nuevoHorario.horaInicio || !nuevoHorario.horaFin) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben ser completados.",
        variant: "destructive",
      })
      return
    }

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (nuevoHorario.horaInicio >= nuevoHorario.horaFin) {
      toast({
        title: "Error",
        description: "La hora de fin debe ser posterior a la hora de inicio.",
        variant: "destructive",
      })
      return
    }

    // Verificar si hay conflictos de horario
    const conflicto = horarios.some(
      (h) =>
        h.profesorId === nuevoHorario.profesorId &&
        h.dia === nuevoHorario.dia &&
        ((nuevoHorario.horaInicio >= h.horaInicio && nuevoHorario.horaInicio < h.horaFin) ||
          (nuevoHorario.horaFin > h.horaInicio && nuevoHorario.horaFin <= h.horaFin) ||
          (nuevoHorario.horaInicio <= h.horaInicio && nuevoHorario.horaFin >= h.horaFin)),
    )

    if (conflicto) {
      toast({
        title: "Error",
        description: "Existe un conflicto de horario. El profesor ya tiene una clase asignada en ese horario.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Guardando horario:", nuevoHorario)

      // Guardar nuevo horario
      const docRef = await addDoc(collection(db, "horarios"), nuevoHorario)
      console.log("Horario guardado con ID:", docRef.id)

      // Actualizar estado local
      setHorarios([...horarios, { id: docRef.id, ...nuevoHorario }])

      toast({
        title: "Horario guardado",
        description: "El horario ha sido guardado correctamente.",
      })

      // Resetear formulario
      setNuevoHorario({
        profesorId: profesorSeleccionado,
        dia: "lunes",
        horaInicio: "08:00",
        horaFin: "09:00",
        anioEscolar,
      })
      setMostrarFormulario(false)
    } catch (error) {
      console.error("Error al guardar horario:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el horario. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarHorario = async (horarioId: string) => {
    if (confirm("¿Estás seguro de eliminar este horario? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        await deleteDoc(doc(db, "horarios", horarioId))

        // Actualizar estado local
        setHorarios(horarios.filter((h) => h.id !== horarioId))

        toast({
          title: "Horario eliminado",
          description: "El horario ha sido eliminado correctamente.",
        })
      } catch (error) {
        console.error("Error al eliminar horario:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el horario. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const obtenerNombreProfesor = (profesorId: string) => {
    const profesor = profesores.find((p) => p.id === profesorId)
    return profesor ? `${profesor.nombre} ${profesor.apellidos}` : "Desconocido"
  }

  const obtenerNombreCurso = (cursoId?: string) => {
    if (!cursoId) return "No asignado"
    const curso = cursos.find((c) => c.id === cursoId)
    return curso ? curso.nombre : "Desconocido"
  }

  const obtenerNombreGrado = (gradoId?: string) => {
    if (!gradoId) return "No asignado"
    const grado = grados.find((g) => g.id === gradoId)
    return grado ? grado.nombre : "Desconocido"
  }

  const obtenerNombreSeccion = (seccionId?: string) => {
    if (!seccionId) return "No asignada"
    const seccion = secciones.find((s) => s.id === seccionId)
    return seccion ? seccion.nombre : "Desconocida"
  }

  const obtenerNombreDia = (dia: string) => {
    const diaObj = diasSemana.find((d) => d.valor === dia)
    return diaObj ? diaObj.nombre : dia
  }

  const ordenarHorariosPorDiaYHora = (horarios: Horario[]) => {
    const ordenDias = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
    }

    return [...horarios].sort((a, b) => {
      // Primero ordenar por día
      const ordenDiaA = ordenDias[a.dia as keyof typeof ordenDias] || 7
      const ordenDiaB = ordenDias[b.dia as keyof typeof ordenDias] || 7
      if (ordenDiaA !== ordenDiaB) {
        return ordenDiaA - ordenDiaB
      }

      // Luego ordenar por hora de inicio
      return a.horaInicio.localeCompare(b.horaInicio)
    })
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Horarios</h1>
        <p className="text-gray-500">Asigna horarios a los profesores para el año escolar.</p>
      </div>

      <Tabs defaultValue="profesores">
        <TabsList>
          <TabsTrigger value="profesores">Seleccionar Profesor</TabsTrigger>
          <TabsTrigger value="horarios" disabled={!profesorSeleccionado}>
            Horario del Profesor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profesores" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profesores</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar profesor..."
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
              ) : profesoresFiltrados.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay profesores disponibles</h3>
                  <p className="text-gray-500">No se encontraron profesores que coincidan con tu búsqueda.</p>
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
                          Email
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
                      {profesoresFiltrados.map((profesor) => (
                        <tr key={profesor.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {profesor.nombre} {profesor.apellidos}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{profesor.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              onClick={() => {
                                setProfesorSeleccionado(profesor.id)
                                cargarHorariosProfesor(profesor.id)
                              }}
                              size="sm"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Ver Horario
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios" className="mt-6">
          {!profesorSeleccionado ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Selecciona un profesor</h3>
                <p className="text-gray-500 mb-4">Debes seleccionar un profesor para ver su horario.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Horario de {obtenerNombreProfesor(profesorSeleccionado)} - Año {anioEscolar}
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    className="rounded-md border border-gray-300 p-2"
                    value={anioEscolar}
                    onChange={(e) => {
                      setAnioEscolar(e.target.value)
                      cargarHorariosProfesor(profesorSeleccionado)
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year.toString()}>
                        Año Escolar {year}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                    {mostrarFormulario ? "Cancelar" : <Plus className="mr-2 h-4 w-4" />}
                    {mostrarFormulario ? "Cancelar" : "Agregar Horario"}
                  </Button>
                </div>
              </div>

              {mostrarFormulario && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Nuevo Horario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={guardarHorario} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="dia">Día</Label>
                          <select
                            id="dia"
                            name="dia"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={nuevoHorario.dia}
                            onChange={handleChangeNuevoHorario}
                            required
                          >
                            {diasSemana.map((dia) => (
                              <option key={dia.valor} value={dia.valor}>
                                {dia.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="horaInicio">Hora de Inicio</Label>
                          <Input
                            id="horaInicio"
                            name="horaInicio"
                            type="time"
                            value={nuevoHorario.horaInicio}
                            onChange={handleChangeNuevoHorario}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="horaFin">Hora de Fin</Label>
                          <Input
                            id="horaFin"
                            name="horaFin"
                            type="time"
                            value={nuevoHorario.horaFin}
                            onChange={handleChangeNuevoHorario}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cursoId">Curso</Label>
                          <select
                            id="cursoId"
                            name="cursoId"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={nuevoHorario.cursoId || ""}
                            onChange={handleChangeNuevoHorario}
                          >
                            <option value="">Seleccionar Curso</option>
                            {cursos.map((curso) => (
                              <option key={curso.id} value={curso.id}>
                                {curso.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gradoId">Grado</Label>
                          <select
                            id="gradoId"
                            name="gradoId"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={nuevoHorario.gradoId || ""}
                            onChange={handleChangeNuevoHorario}
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
                          <Label htmlFor="seccionId">Sección</Label>
                          <select
                            id="seccionId"
                            name="seccionId"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={nuevoHorario.seccionId || ""}
                            onChange={handleChangeNuevoHorario}
                            disabled={!nuevoHorario.gradoId}
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
                          <Label htmlFor="aula">Aula</Label>
                          <Input
                            id="aula"
                            name="aula"
                            type="text"
                            value={nuevoHorario.aula || ""}
                            onChange={handleChangeNuevoHorario}
                            placeholder="Ej: Aula 101"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                          <Save className="mr-2 h-4 w-4" />
                          {loading ? "Guardando..." : "Guardar Horario"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Horario Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : horarios.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay horarios asignados</h3>
                      <p className="text-gray-500">
                        Este profesor no tiene horarios asignados para el año escolar seleccionado.
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
                              Día
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Horario
                            </th>
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
                              Grado y Sección
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Aula
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
                          {ordenarHorariosPorDiaYHora(horarios).map((horario) => (
                            <tr key={horario.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{obtenerNombreDia(horario.dia)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {horario.horaInicio} - {horario.horaFin}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{obtenerNombreCurso(horario.cursoId)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {obtenerNombreGrado(horario.gradoId)} "{obtenerNombreSeccion(horario.seccionId)}"
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{horario.aula || "No asignada"}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button
                                  variant="destructive"
                                  onClick={() => eliminarHorario(horario.id)}
                                  disabled={loading}
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
