"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { GraduationCap, Users, BookOpen } from "lucide-react"

interface Grado {
  id: string
  nombre: string
  nivel: string
}

export default function AdministrarGradosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [grados, setGrados] = useState<Grado[]>([])
  const [estadisticas, setEstadisticas] = useState<{
    [key: string]: { alumnos: number; secciones: number; cursos: number }
  }>({})

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else if (user) {
      cargarGrados()
    }
  }, [user, router])

  const cargarGrados = async () => {
    setLoading(true)
    try {
      // Cargar grados
      const gradosSnapshot = await getDocs(collection(db, "grados"))
      const gradosData = gradosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grado[]
      setGrados(gradosData)

      // Cargar estadísticas básicas para cada grado
      const stats: { [key: string]: { alumnos: number; secciones: number; cursos: number } } = {}

      // Cargar secciones para contar por grado
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Cargar asignaciones para contar alumnos por grado
      const asignacionesSnapshot = await getDocs(collection(db, "asignaciones"))
      const asignacionesData = asignacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Cargar grupos para contar cursos por grado
      const gruposSnapshot = await getDocs(collection(db, "grupos"))
      const gruposData = gruposSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Inicializar estadísticas para cada grado
      gradosData.forEach((grado) => {
        const gradoId = grado.id
        const seccionesPorGrado = seccionesData.filter((s: any) => s.gradoId === gradoId).length
        const alumnosPorGrado = new Set(
          asignacionesData.filter((a: any) => a.gradoId === gradoId).map((a: any) => a.alumnoId),
        ).size
        const cursosPorGrado = gruposData.filter((g: any) => g.gradoId === gradoId).length

        stats[gradoId] = {
          alumnos: alumnosPorGrado,
          secciones: seccionesPorGrado,
          cursos: cursosPorGrado,
        }
      })

      setEstadisticas(stats)
    } catch (error) {
      console.error("Error al cargar grados:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los grados.",
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
        <h1 className="text-3xl font-bold tracking-tight">Administrar Grados</h1>
        <p className="text-gray-500">Visualiza y gestiona los grados, secciones, alumnos y cursos.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : grados.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">No hay grados</h3>
            <p className="text-gray-500 mb-4">No se encontraron grados en el sistema.</p>
            <Button onClick={() => router.push("/dashboard/admin/grados-secciones")}>
              Gestionar Grados y Secciones
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grados.map((grado) => (
            <Card key={grado.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{grado.nombre}</CardTitle>
                <p className="text-sm text-gray-500">Nivel: {grado.nivel}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-blue-100 p-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Alumnos</p>
                    <p className="font-bold">{estadisticas[grado.id]?.alumnos || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-blue-100 p-2 mb-1">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Secciones</p>
                    <p className="font-bold">{estadisticas[grado.id]?.secciones || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-blue-100 p-2 mb-1">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Cursos</p>
                    <p className="font-bold">{estadisticas[grado.id]?.cursos || 0}</p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/dashboard/admin/administrar-grados/${grado.id}`)}
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
