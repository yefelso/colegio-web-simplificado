"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, Users, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface GradoSeccion {
  id: string
  gradoId: string
  seccionId: string
  nombre: string
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
}

interface Profesor {
  id: string
  nombre: string
  apellidos: string
  email: string
}

interface Grupo {
  id: string
  gradoSeccionId?: string
  gradoId?: string
  seccionId?: string
  cursoId: string
  profesorId: string
  anioEscolar: string
  gradoSeccion?: {
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

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  email: string
}

export default function GruposPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gradoSecciones, setGradoSecciones] = useState<GradoSeccion[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnosGrupo, setAlumnosGrupo] = useState<Alumno[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<string[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>("")
  const [dialogAsignarAlumnosOpen, setDialogAsignarAlumnosOpen] = useState(false)

  const [nuevoGrupo, setNuevoGrupo] = useState({
    gradoSeccionId: "",
    cursoId: "",
    profesorId: "",
    anioEscolar: new Date().getFullYear().toString(),
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else {
      cargarDatos()
    }
  }, [user, router])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar grado-secciones
      const gradoSeccionesSnapshot = await getDocs(collection(db, "gradoSecciones"))
      const gradoSeccionesData = gradoSeccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GradoSeccion[]
      setGradoSecciones(gradoSeccionesData)

      // Cargar cursos
      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[]
      setCursos(cursosData)

      // Cargar profesores
      const profesoresQuery = query(collection(db, "users"), where("role", "==", "profesor"))
      const profesoresSnapshot = await getDocs(profesoresQuery)
      const profesoresData = profesoresSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Profesor[]
      setProfesores(profesoresData)

      // Cargar alumnos
      const alumnosQuery = query(collection(db, "users"), where("role", "==", "alumno"))
      const alumnosSnapshot = await getDocs(alumnosQuery)
      const alumnosData = alumnosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Alumno[]
      setAlumnos(alumnosData)

      // Cargar grupos
      await cargarGrupos()
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

  const cargarGrupos = async () => {
    try {
      const gruposSnapshot = await getDocs(collection(db, "grupos"))
      const gruposData = gruposSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grupo[]

      // Obtener información adicional para cada grupo
      const gruposCompletos = await Promise.all(
        gruposData.map(async (grupo) => {
          try {
            // Verificar si el grupo tiene gradoSeccionId
            let gradoSeccionInfo = undefined

            if (grupo.gradoSeccionId) {
              // Si tiene gradoSeccionId, obtener la información del documento
              const gradoSeccionDoc = await getDoc(doc(db, "gradoSecciones", grupo.gradoSeccionId))
              if (gradoSeccionDoc.exists()) {
                gradoSeccionInfo = { nombre: gradoSeccionDoc.data().nombre }
              }
            } else if (grupo.gradoId && grupo.seccionId) {
              // Si no tiene gradoSeccionId pero tiene gradoId y seccionId (formato antiguo)
              // Buscar el grado y la sección por separado
              const gradoDoc = await getDoc(doc(db, "grados", grupo.gradoId))
              const seccionDoc = await getDoc(doc(db, "secciones", grupo.seccionId))

              if (gradoDoc.exists() && seccionDoc.exists()) {
                const gradoData = gradoDoc.data()
                const seccionData = seccionDoc.data()
                gradoSeccionInfo = {
                  nombre: `${gradoData.nombre} - Sección ${seccionData.nombre}`,
                }
              }
            }

            // Obtener información del curso
            let cursoInfo = undefined
            if (grupo.cursoId) {
              const cursoDoc = await getDoc(doc(db, "cursos", grupo.cursoId))
              if (cursoDoc.exists()) {
                cursoInfo = { nombre: cursoDoc.data().nombre }
              }
            }

            // Obtener información del profesor
            let profesorInfo = undefined
            if (grupo.profesorId) {
              const profesorDoc = await getDoc(doc(db, "users", grupo.profesorId))
              if (profesorDoc.exists()) {
                const data = profesorDoc.data()
                profesorInfo = {
                  nombre: data.nombre || "",
                  apellidos: data.apellidos || "",
                }
              }
            }

            return {
              ...grupo,
              gradoSeccion: gradoSeccionInfo,
              curso: cursoInfo,
              profesor: profesorInfo,
            }
          } catch (error) {
            console.error("Error al procesar grupo:", grupo.id, error)
            // Devolver el grupo sin información adicional en caso de error
            return grupo
          }
        }),
      )

      setGrupos(gruposCompletos)
    } catch (error) {
      console.error("Error al cargar grupos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos.",
        variant: "destructive",
      })
    }
  }

  const handleChangeGrupo = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setNuevoGrupo((prev) => ({ ...prev, [name]: value }))
  }

  const crearGrupo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoGrupo.gradoSeccionId || !nuevoGrupo.cursoId || !nuevoGrupo.profesorId) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Verificar si ya existe un grupo con la misma combinación
      const gruposRef = collection(db, "grupos")
      const q = query(
        gruposRef,
        where("gradoSeccionId", "==", nuevoGrupo.gradoSeccionId),
        where("cursoId", "==", nuevoGrupo.cursoId),
        where("anioEscolar", "==", nuevoGrupo.anioEscolar),
      )
      const gruposSnapshot = await getDocs(q)

      if (!gruposSnapshot.empty) {
        toast({
          title: "Error",
          description: "Ya existe un grupo con esta combinación para este año escolar.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Obtener información del grado-sección
      const gradoSeccionDoc = await getDoc(doc(db, "gradoSecciones", nuevoGrupo.gradoSeccionId))
      if (!gradoSeccionDoc.exists()) {
        toast({
          title: "Error",
          description: "El grado-sección seleccionado no existe.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const gradoSeccionData = gradoSeccionDoc.data()

      // Crear el grupo
      const grupoRef = await addDoc(collection(db, "grupos"), {
        ...nuevoGrupo,
        gradoId: gradoSeccionData.gradoId,
        seccionId: gradoSeccionData.seccionId,
        createdAt: new Date().toISOString(),
      })

      // Crear la sala virtual para el grupo
      await addDoc(collection(db, "salas"), {
        grupoId: grupoRef.id,
        nombre: `Sala Virtual - ${nuevoGrupo.anioEscolar}`,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Grupo creado",
        description: "El grupo y su sala virtual han sido creados correctamente.",
      })

      setNuevoGrupo({
        gradoSeccionId: "",
        cursoId: "",
        profesorId: "",
        anioEscolar: new Date().getFullYear().toString(),
      })

      cargarGrupos()
    } catch (error) {
      console.error("Error al crear grupo:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el grupo. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarGrupo = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este grupo? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        // Eliminar el grupo
        await deleteDoc(doc(db, "grupos", id))

        // Eliminar la sala virtual asociada
        const salasRef = collection(db, "salas")
        const q = query(salasRef, where("grupoId", "==", id))
        const salasSnapshot = await getDocs(q)

        const promesasEliminacion = salasSnapshot.docs.map((doc) => deleteDoc(doc.ref))
        await Promise.all(promesasEliminacion)

        toast({
          title: "Grupo eliminado",
          description: "El grupo y su sala virtual han sido eliminados correctamente.",
        })

        cargarGrupos()
      } catch (error) {
        console.error("Error al eliminar grupo:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el grupo. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const abrirDialogAsignarAlumnos = async (grupoId: string) => {
    setGrupoSeleccionado(grupoId)

    try {
      setLoading(true)

      // Obtener el grupo
      const grupoDoc = await getDoc(doc(db, "grupos", grupoId))
      if (!grupoDoc.exists()) {
        toast({
          title: "Error",
          description: "El grupo no existe.",
          variant: "destructive",
        })
        return
      }

      const grupoData = grupoDoc.data()

      // Obtener alumnos ya asignados al grupo
      const asignacionesRef = collection(db, "asignacionesGrupo")
      const q = query(asignacionesRef, where("grupoId", "==", grupoId))
      const asignacionesSnapshot = await getDocs(q)

      const alumnosIds = asignacionesSnapshot.docs.map((doc) => doc.data().alumnoId)
      setAlumnosSeleccionados(alumnosIds)

      // Determinar qué IDs usar para buscar alumnos
      let gradoId, seccionId

      if (grupoData.gradoSeccionId) {
        // Si tiene gradoSeccionId, obtener gradoId y seccionId del documento
        const gradoSeccionDoc = await getDoc(doc(db, "gradoSecciones", grupoData.gradoSeccionId))
        if (gradoSeccionDoc.exists()) {
          const gsData = gradoSeccionDoc.data()
          gradoId = gsData.gradoId
          seccionId = gsData.seccionId
        }
      } else {
        // Si no tiene gradoSeccionId, usar los campos directos
        gradoId = grupoData.gradoId
        seccionId = grupoData.seccionId
      }

      if (!gradoId || !seccionId) {
        toast({
          title: "Error",
          description: "No se pudo determinar el grado y sección del grupo.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Obtener alumnos asignados a esta sección
      const asignacionesSeccionRef = collection(db, "asignaciones")
      const qSeccion = query(
        asignacionesSeccionRef,
        where("gradoId", "==", gradoId),
        where("seccionId", "==", seccionId),
        where("anioEscolar", "==", grupoData.anioEscolar),
      )
      const asignacionesSeccionSnapshot = await getDocs(qSeccion)

      const alumnosSeccionIds = asignacionesSeccionSnapshot.docs.map((doc) => doc.data().alumnoId)

      // Filtrar alumnos que pertenecen a esta sección
      const alumnosSeccion = alumnos.filter((alumno) => alumnosSeccionIds.includes(alumno.id))
      setAlumnosGrupo(alumnosSeccion)

      setDialogAsignarAlumnosOpen(true)
    } catch (error) {
      console.error("Error al abrir diálogo de asignación:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSeleccionAlumno = (alumnoId: string) => {
    setAlumnosSeleccionados((prev) => {
      if (prev.includes(alumnoId)) {
        return prev.filter((id) => id !== alumnoId)
      } else {
        return [...prev, alumnoId]
      }
    })
  }

  const guardarAsignacionAlumnos = async () => {
    if (!grupoSeleccionado) return

    setLoading(true)
    try {
      // Eliminar asignaciones existentes
      const asignacionesRef = collection(db, "asignacionesGrupo")
      const q = query(asignacionesRef, where("grupoId", "==", grupoSeleccionado))
      const asignacionesSnapshot = await getDocs(q)

      const promesasEliminacion = asignacionesSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(promesasEliminacion)

      // Crear nuevas asignaciones
      const promesasCreacion = alumnosSeleccionados.map((alumnoId) =>
        addDoc(collection(db, "asignacionesGrupo"), {
          grupoId: grupoSeleccionado,
          alumnoId,
          fechaAsignacion: new Date().toISOString(),
        }),
      )

      await Promise.all(promesasCreacion)

      toast({
        title: "Alumnos asignados",
        description: "Los alumnos han sido asignados correctamente al grupo.",
      })

      setDialogAsignarAlumnosOpen(false)
    } catch (error) {
      console.error("Error al asignar alumnos:", error)
      toast({
        title: "Error",
        description: "No se pudieron asignar los alumnos al grupo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const abrirSalaVirtual = async (grupoId: string) => {
    try {
      setLoading(true)

      // Buscar la sala virtual asociada al grupo
      const salasRef = collection(db, "salas")
      const q = query(salasRef, where("grupoId", "==", grupoId))
      const salasSnapshot = await getDocs(q)

      if (salasSnapshot.empty) {
        toast({
          title: "Error",
          description: "No se encontró una sala virtual para este grupo.",
          variant: "destructive",
        })
        return
      }

      const salaId = salasSnapshot.docs[0].id
      const url = `/dashboard/sala-virtual/${salaId}`

      // Abrir la sala virtual en una nueva pestaña
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error al abrir sala virtual:", error)
      toast({
        title: "Error",
        description: "No se pudo abrir la sala virtual.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Grupos</h1>
        <p className="text-gray-500">Administra los grupos académicos del colegio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crearGrupo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gradoSeccionId">Grado y Sección</Label>
                <select
                  id="gradoSeccionId"
                  name="gradoSeccionId"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={nuevoGrupo.gradoSeccionId}
                  onChange={handleChangeGrupo}
                  required
                >
                  <option value="">Seleccionar Grado-Sección</option>
                  {gradoSecciones.map((gs) => (
                    <option key={gs.id} value={gs.id}>
                      {gs.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cursoId">Curso</Label>
                <select
                  id="cursoId"
                  name="cursoId"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={nuevoGrupo.cursoId}
                  onChange={handleChangeGrupo}
                  required
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
                <Label htmlFor="profesorId">Profesor</Label>
                <select
                  id="profesorId"
                  name="profesorId"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={nuevoGrupo.profesorId}
                  onChange={handleChangeGrupo}
                  required
                >
                  <option value="">Seleccionar Profesor</option>
                  {profesores.map((profesor) => (
                    <option key={profesor.id} value={profesor.id}>
                      {profesor.nombre} {profesor.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anioEscolar">Año Escolar</Label>
                <input
                  id="anioEscolar"
                  name="anioEscolar"
                  type="number"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={nuevoGrupo.anioEscolar}
                  onChange={handleChangeGrupo}
                  required
                  min="2000"
                  max="2100"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                {loading ? "Creando..." : "Crear Grupo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grupos Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : grupos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay grupos registrados.</p>
            ) : (
              <div className="space-y-2">
                {grupos.map((grupo) => (
                  <div key={grupo.id} className="flex flex-col p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {grupo.gradoSeccion?.nombre || "Grado-Sección no disponible"} -{" "}
                          {grupo.curso?.nombre || "Curso no disponible"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Profesor:{" "}
                          {grupo.profesor ? `${grupo.profesor.nombre} ${grupo.profesor.apellidos}` : "No asignado"}
                        </p>
                        <p className="text-xs text-gray-400">Año Escolar: {grupo.anioEscolar}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarGrupo(grupo.id)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex mt-2 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => abrirDialogAsignarAlumnos(grupo.id)}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Asignar Alumnos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => abrirSalaVirtual(grupo.id)}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        Ver Sala Virtual
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para asignar alumnos */}
      <Dialog open={dialogAsignarAlumnosOpen} onOpenChange={setDialogAsignarAlumnosOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asignar Alumnos al Grupo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : alumnosGrupo.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay alumnos disponibles para este grupo.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Selecciona los alumnos que deseas asignar a este grupo:</p>
                <div className="max-h-96 overflow-y-auto border rounded-md p-2">
                  {alumnosGrupo.map((alumno) => (
                    <div key={alumno.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`alumno-${alumno.id}`}
                        checked={alumnosSeleccionados.includes(alumno.id)}
                        onChange={() => toggleSeleccionAlumno(alumno.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`alumno-${alumno.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                        {alumno.nombre} {alumno.apellidos} - {alumno.email}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDialogAsignarAlumnosOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={guardarAsignacionAlumnos} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Asignaciones"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
