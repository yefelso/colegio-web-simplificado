"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { Users, BookOpen, ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function GradoDetallePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const gradoId = params.gradoId as string

  const [loading, setLoading] = useState(false)
  const [grado, setGrado] = useState<any>(null)
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [anioEscolar, setAnioEscolar] = useState(new Date().getFullYear().toString())

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
        router.push("/dashboard/admin/grados-secciones")
        return
      }
      setGrado({ id: gradoDoc.id, ...gradoDoc.data() })

      // Cargar secciones
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seccion[]
      setSecciones(seccionesData)
      console.log("Secciones cargadas:", seccionesData.length)

      // Cargar asignaciones del grado
      const asignacionesRef = collection(db, "asignaciones")
      const asignacionesQuery = query(asignacionesRef, where("gradoId", "==", gradoId))
      const asignacionesSnapshot = await getDocs(asignacionesQuery)
      const asignacionesData = asignacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asignacion[]
      setAsignaciones(asignacionesData)
      console.log("Asignaciones cargadas:", asignacionesData.length)

      // Cargar alumnos asignados
      if (asignacionesData.length > 0) {
        const alumnosIds = [...new Set(asignacionesData.map((a) => a.alumnoId))]
        console.log("IDs de alumnos a cargar:", alumnosIds)

        const alumnosPromises = alumnosIds.map(async (id) => {
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
            console.error("Error al cargar alumno:", id, error)
            return null
          }
        })

        const alumnosData = (await Promise.all(alumnosPromises)).filter(
          (alumno): alumno is Alumno => alumno !== null,
        ) as Alumno[]
        setAlumnos(alumnosData)
        console.log("Alumnos cargados:", alumnosData.length)
      }

      // Cargar cursos
      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[]
      setCursos(cursosData)
      console.log("Cursos cargados:", cursosData.length)

      // Cargar grupos del grado
      const gruposRef = collection(db, "grupos")
      const gruposQuery = query(gruposRef, where("gradoId", "==", gradoId))
      const gruposSnapshot = await getDocs(gruposQuery)
      const gruposData = gruposSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grupo[]
      setGrupos(gruposData)
      console.log("Grupos cargados:", gruposData.length)

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
        console.log("Profesores cargados:", profesoresData.length)
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
          onClick={() => router.push("/dashboard/admin/grados-secciones")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Grados y Secciones
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
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cursos</p>
                <h3 className="text-2xl font-bold">{grupos.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
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
      </div>

      <Tabs defaultValue="secciones">
        <TabsList>
          <TabsTrigger value="secciones">Secciones</TabsTrigger>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
        </TabsList>

        <TabsContent value="secciones" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : secciones.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay secciones</h3>
                <p className="text-gray-500 mb-4">Este grado no tiene secciones asignadas.</p>
                <Button onClick={() => router.push("/dashboard/admin/grados-secciones")}>Gestionar Secciones</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {secciones.map((seccion) => {
                const alumnosSeccion = filtrarAlumnosPorSeccion(seccion.id)
                return (
                  <Card key={seccion.id}>
                    <CardHeader>
                      <CardTitle>Sección "{seccion.nombre}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Alumnos Inscritos</h3>
                          <Button size="sm" onClick={() => router.push("/dashboard/admin/inscripciones")}>
                            Inscribir Alumnos
                          </Button>
                        </div>

                        {alumnosSeccion.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No hay alumnos inscritos en esta sección.</p>
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
              {secciones.map((seccion) => {
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
      </Tabs>
    </div>
  )
}
