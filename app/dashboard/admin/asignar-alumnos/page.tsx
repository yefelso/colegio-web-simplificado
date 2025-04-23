"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, query, where, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { UserPlus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  gradoId?: string
}

interface GradoSeccion {
  id: string
  gradoId: string
  seccionId: string
  nombre: string
}

export default function AsignarAlumnosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [gradoSecciones, setGradoSecciones] = useState<GradoSeccion[]>([])
  const [seccionesPorGrado, setSeccionesPorGrado] = useState<Record<string, Seccion[]>>({})
  const [busqueda, setBusqueda] = useState("")
  const [gradoSeleccionado, setGradoSeleccionado] = useState("")
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("")
  const [anioEscolar, setAnioEscolar] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatos()
    }
  }, [user, router])

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

  useEffect(() => {
    if (gradoSeleccionado) {
      setSeccionSeleccionada("")
    }
  }, [gradoSeleccionado])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar alumnos
      const alumnosQuery = query(collection(db, "users"), where("role", "==", "alumno"))
      const alumnosSnapshot = await getDocs(alumnosQuery)
      const alumnosData = alumnosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Alumno[]
      setAlumnos(alumnosData)
      setAlumnosFiltrados(alumnosData)

      // Cargar grados
      const gradosSnapshot = await getDocs(collection(db, "grados"))
      const gradosData = gradosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grado[]
      setGrados(gradosData)

      // Cargar secciones
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seccion[]
      setSecciones(seccionesData)

      // Cargar relaciones grado-sección
      const gradoSeccionesSnapshot = await getDocs(collection(db, "gradoSecciones"))
      const gradoSeccionesData = gradoSeccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GradoSeccion[]
      setGradoSecciones(gradoSeccionesData)

      // Organizar secciones por grado
      const seccionesPorGradoObj: Record<string, Seccion[]> = {}
      gradoSeccionesData.forEach((gs) => {
        const seccion = seccionesData.find((s) => s.id === gs.seccionId)
        if (seccion) {
          if (!seccionesPorGradoObj[gs.gradoId]) {
            seccionesPorGradoObj[gs.gradoId] = []
          }
          seccionesPorGradoObj[gs.gradoId].push(seccion)
        }
      })
      setSeccionesPorGrado(seccionesPorGradoObj)
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

  const asignarAlumno = async (alumnoId: string) => {
    if (!gradoSeleccionado || !seccionSeleccionada || !anioEscolar) {
      toast({
        title: "Error",
        description: "Debes seleccionar un grado, sección y año escolar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Verificar si el alumno ya está inscrito en el mismo grado y sección
      const asignacionesRef = collection(db, "asignaciones")
      const q = query(
        asignacionesRef,
        where("alumnoId", "==", alumnoId),
        where("gradoId", "==", gradoSeleccionado),
        where("seccionId", "==", seccionSeleccionada),
        where("anioEscolar", "==", anioEscolar),
      )
      const asignacionesSnapshot = await getDocs(q)

      if (!asignacionesSnapshot.empty) {
        toast({
          title: "Error",
          description: "El alumno ya está inscrito en este grado y sección para el año escolar seleccionado.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Crear nueva asignación
      await addDoc(collection(db, "asignaciones"), {
        alumnoId,
        gradoId: gradoSeleccionado,
        seccionId: seccionSeleccionada,
        anioEscolar,
        fechaInscripcion: new Date().toISOString(),
      })

      toast({
        title: "Alumno asignado",
        description: "El alumno ha sido asignado correctamente al grado y sección.",
      })
    } catch (error) {
      console.error("Error al asignar alumno:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar al alumno. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asignar Alumnos a Grados</h1>
        <p className="text-gray-500">Asigna alumnos a grados y secciones específicas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Grado y Sección</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="grado">Grado</Label>
              <Select value={gradoSeleccionado} onValueChange={setGradoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Grado" />
                </SelectTrigger>
                <SelectContent>
                  {grados.map((grado) => (
                    <SelectItem key={grado.id} value={grado.id}>
                      {grado.nombre} - {grado.nivel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seccion">Sección</Label>
              <Select
                value={seccionSeleccionada}
                onValueChange={setSeccionSeleccionada}
                disabled={!gradoSeleccionado || !seccionesPorGrado[gradoSeleccionado]?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Sección" />
                </SelectTrigger>
                <SelectContent>
                  {gradoSeleccionado &&
                    seccionesPorGrado[gradoSeleccionado]?.map((seccion) => (
                      <SelectItem key={seccion.id} value={seccion.id}>
                        Sección {seccion.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alumnosFiltrados.map((alumno) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => asignarAlumno(alumno.id)}
                          disabled={!gradoSeleccionado || !seccionSeleccionada || loading}
                          size="sm"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Asignar
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
    </div>
  )
}
