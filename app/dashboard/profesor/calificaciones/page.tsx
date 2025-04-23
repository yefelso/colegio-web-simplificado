"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Users, FileText } from "lucide-react"

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

export default function CalificacionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])

  useEffect(() => {
    if (user && user.role !== "profesor") {
      router.push("/dashboard")
    } else if (user) {
      cargarGrupos()
    }
  }, [user, router])

  const cargarGrupos = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Obtener grupos asignados al profesor
      const gruposRef = collection(db, "grupos")
      const gruposQuery = query(gruposRef, where("profesorId", "==", user.uid))
      const gruposSnapshot = await getDocs(gruposQuery)

      if (gruposSnapshot.empty) {
        setGrupos([])
      } else {
        const gruposPromises = gruposSnapshot.docs.map(async (doc) => {
          const grupoData = doc.data()

          // Obtener información adicional
          const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
          const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
          const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))

          return {
            id: doc.id,
            ...grupoData,
            grado: gradoDoc.exists() ? gradoDoc.data() : undefined,
            seccion: seccionDoc.exists() ? seccionDoc.data() : undefined,
            curso: cursoDoc.exists() ? cursoDoc.data() : undefined,
          } as Grupo
        })

        const gruposData = await Promise.all(gruposPromises)
        setGrupos(gruposData)
      }
    } catch (error) {
      console.error("Error al cargar grupos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus grupos asignados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Calificaciones</h1>
        <p className="text-gray-500">Selecciona un grupo para gestionar las calificaciones de los alumnos.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes grupos asignados</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              Actualmente no tienes grupos asignados para calificar. Contacta con el administrador para que te asigne
              grupos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <Link href={`/dashboard/profesor/calificaciones/${grupo.id}`} key={grupo.id}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{grupo.curso?.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                      <span>
                        {grupo.grado?.nombre} "{grupo.seccion?.nombre}"
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Año Escolar: {grupo.anioEscolar}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Ver calificaciones</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
