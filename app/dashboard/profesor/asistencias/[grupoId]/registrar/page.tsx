"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, query, where, getDoc, doc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

interface Alumno {
  id: string
  nombre: string
  apellidos: string
  dni: string
  asistencia: {
    estado: "presente" | "ausente" | "tardanza"
    observaciones: string
  }
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

export default function RegistrarAsistenciaPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const grupoId = params.grupoId as string

  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [asistenciaExistente, setAsistenciaExistente] = useState(false)

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

      // Obtener datos de los alumnos
      const alumnosData: Alumno[] = []

      for (const asignacionDoc of asignacionesSnapshot.docs) {
        const asignacion = asignacionDoc.data()
        const alumnoDoc = await getDoc(doc(db, "users", asignacion.alumnoId))

        if (alumnoDoc.exists() && alumnoDoc.data().role === "alumno") {
          const alumnoData = alumnoDoc.data()

          alumnosData.push({
            id: alumnoDoc.id,
            nombre: alumnoData.nombre,
            apellidos: alumnoData.apellidos,
            dni: alumnoData.dni,
            asistencia: {
              estado: "presente", // Por defecto todos presentes
              observaciones: "",
            },
          })
        }
      }

      // Ordenar alumnos por apellido
      alumnosData.sort((a, b) => a.apellidos.localeCompare(b.apellidos))

      // Verificar si ya existe asistencia para este grupo en la fecha seleccionada
      const asistenciasRef = collection(db, "asistencias")
      const asistenciasQuery = query(
        asistenciasRef,
        where("grupoId", "==", grupoId),
        where("fecha", "==", fecha),
        where("tipo", "==", "curso"),
      )
      const asistenciasSnapshot = await getDocs(asistenciasQuery)

      if (!asistenciasSnapshot.empty) {
        setAsistenciaExistente(true)
        toast({
          title: "Asistencia ya registrada",
          description: "Ya existe un registro de asistencia para este grupo en la fecha seleccionada.",
        })
      } else {
        setAsistenciaExistente(false)
      }

      setAlumnos(alumnosData)
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

  const handleEstadoChange = (alumnoId: string, estado: "presente" | "ausente" | "tardanza") => {
    setAlumnos(
      alumnos.map((alumno) =>
        alumno.id === alumnoId ? { ...alumno, asistencia: { ...alumno.asistencia, estado } } : alumno,
      ),
    )
  }

  const handleObservacionesChange = (alumnoId: string, observaciones: string) => {
    setAlumnos(
      alumnos.map((alumno) =>
        alumno.id === alumnoId ? { ...alumno, asistencia: { ...alumno.asistencia, observaciones } } : alumno,
      ),
    )
  }

  const guardarAsistencias = async () => {
    if (!user || !grupo) return

    setGuardando(true)
    try {
      const hora = new Date().toLocaleTimeString()
      const batch = []

      // Crear un registro de asistencia para cada alumno
      for (const alumno of alumnos) {
        batch.push(
          addDoc(collection(db, "asistencias"), {
            alumnoId: alumno.id,
            alumnoNombre: `${alumno.nombre} ${alumno.apellidos}`,
            fecha,
            hora,
            estado: alumno.asistencia.estado,
            observaciones: alumno.asistencia.observaciones,
            registradoPor: user.uid,
            registradoPorNombre: `${user.nombre} ${user.apellidos}`,
            grupoId: grupo.id,
            gradoId: grupo.gradoId,
            seccionId: grupo.seccionId,
            cursoId: grupo.cursoId,
            tipo: "curso",
            notificado: false,
            createdAt: serverTimestamp(),
          }),
        )
      }

      await Promise.all(batch)

      toast({
        title: "Asistencias guardadas",
        description: "Las asistencias han sido registradas correctamente.",
      })

      router.push("/dashboard/profesor/asistencias")
    } catch (error) {
      console.error("Error al guardar asistencias:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las asistencias. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFecha(e.target.value)
    // Verificar si ya existe asistencia para la nueva fecha
    cargarDatos()
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
            <h1 className="text-3xl font-bold tracking-tight">Registrar Asistencia</h1>
            {grupo && (
              <p className="text-gray-500">
                {grupo.curso?.nombre} - {grupo.grado?.nombre} "{grupo.seccion?.nombre}"
              </p>
            )}
          </div>
        </div>
        <div>
          <input type="date" value={fecha} onChange={handleFechaChange} className="px-3 py-2 border rounded-md" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : alumnos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No hay alumnos en este grupo</h3>
            <p className="text-gray-500 text-center max-w-md">No se encontraron alumnos asignados a este grupo.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Lista de Alumnos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alumnos.map((alumno) => (
                  <div key={alumno.id} className="p-4 border rounded-md">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {alumno.apellidos}, {alumno.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">DNI: {alumno.dni}</p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex space-x-2">
                          <Button
                            variant={alumno.asistencia.estado === "presente" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleEstadoChange(alumno.id, "presente")}
                            className={alumno.asistencia.estado === "presente" ? "bg-green-600" : ""}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Presente
                          </Button>
                          <Button
                            variant={alumno.asistencia.estado === "tardanza" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleEstadoChange(alumno.id, "tardanza")}
                            className={alumno.asistencia.estado === "tardanza" ? "bg-yellow-600" : ""}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Tardanza
                          </Button>
                          <Button
                            variant={alumno.asistencia.estado === "ausente" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleEstadoChange(alumno.id, "ausente")}
                            className={alumno.asistencia.estado === "ausente" ? "bg-red-600" : ""}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Ausente
                          </Button>
                        </div>
                      </div>
                    </div>
                    {alumno.asistencia.estado !== "presente" && (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Observaciones (opcional)"
                          value={alumno.asistencia.observaciones}
                          onChange={(e) => handleObservacionesChange(alumno.id, e.target.value)}
                          className="h-20"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={guardarAsistencias} disabled={guardando || asistenciaExistente} size="lg">
              <Save className="mr-2 h-4 w-4" />
              {guardando ? "Guardando..." : "Guardar Asistencias"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
