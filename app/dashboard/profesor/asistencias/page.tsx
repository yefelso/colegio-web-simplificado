"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Users, ClipboardCheck } from "lucide-react"
import Link from "next/link"

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
  cantidadAlumnos: number
}

export default function AsistenciasProfesorPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])

  useEffect(() => {
    if (user && user.role !== "profesor") {
      router.push("/dashboard")
    } else if (user) {
      cargarGruposProfesor()
    }
  }, [user, router])

  const cargarGruposProfesor = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Obtener grupos del profesor
      const gruposRef = collection(db, "grupos")
      const gruposQuery = query(gruposRef, where("profesorId", "==", user.uid))
      const gruposSnapshot = await getDocs(gruposQuery)

      if (gruposSnapshot.empty) {
        setGrupos([])
        setLoading(false)
        return
      }

      // Para cada grupo, obtener información adicional
      const gruposData = await Promise.all(
        gruposSnapshot.docs.map(async (grupoDoc) => {
          const grupoData = grupoDoc.data() as Grupo
          const grupoId = grupoDoc.id

          // Obtener información del grado
          const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
          // Obtener información de la sección
          const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
          // Obtener información del curso
          const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))

          // Contar alumnos en este grupo
          const asignacionesRef = collection(db, "asignaciones")
          const asignacionesQuery = query(
            asignacionesRef,
            where("gradoId", "==", grupoData.gradoId),
            where("seccionId", "==", grupoData.seccionId),
          )
          const asignacionesSnapshot = await getDocs(asignacionesQuery)

          return {
            id: grupoId,
            ...grupoData,
            grado: gradoDoc.exists() ? (gradoDoc.data() as Grupo["grado"]) : undefined,
            seccion: seccionDoc.exists() ? (seccionDoc.data() as Grupo["seccion"]) : undefined,
            curso: cursoDoc.exists() ? (cursoDoc.data() as Grupo["curso"]) : undefined,
            cantidadAlumnos: asignacionesSnapshot.docs.length,
          }
        }),
      )

      setGrupos(gruposData)
    } catch (error) {
      console.error("Error al cargar grupos del profesor:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus grupos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asistencias</h1>
        <p className="text-gray-500">Gestiona la asistencia de tus alumnos por grupo.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes grupos asignados</h3>
            <p className="text-gray-500 text-center max-w-md">
              No se encontraron grupos asignados a tu usuario. Contacta con administración para más información.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <Card key={grupo.id} className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle>{grupo.curso?.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {grupo.grado?.nombre} "{grupo.seccion?.nombre}"
                    </p>
                    <div className="flex items-center mt-1">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">{grupo.cantidadAlumnos} alumnos</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link href={`/dashboard/profesor/asistencias/${grupo.id}/registrar`}>
                      <Button variant="outline" className="w-full">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Registrar asistencia
                      </Button>
                    </Link>
                    <Link href={`/dashboard/profesor/asistencias/${grupo.id}/historial`}>
                      <Button variant="ghost" className="w-full">
                        Ver historial
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
