"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { BookOpen, Users, Video, FileText } from "lucide-react"
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
  salaId?: string
}

interface Sala {
  id: string
  grupoId: string
  nombre: string
  createdAt: string
}

export default function GruposProfesorPage() {
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
      // Obtener grupos asignados al profesor
      const gruposRef = collection(db, "grupos")
      const q = query(gruposRef, where("profesorId", "==", user.uid))
      const gruposSnapshot = await getDocs(q)

      if (gruposSnapshot.empty) {
        setGrupos([])
        setLoading(false)
        return
      }

      // Obtener información adicional para cada grupo
      const gruposPromises = gruposSnapshot.docs.map(async (grupoDoc) => {
        const grupoData = grupoDoc.data()
        const gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
        const seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
        const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))

        // Obtener la sala virtual asociada al grupo
        const salasRef = collection(db, "salas")
        const salasQuery = query(salasRef, where("grupoId", "==", grupoDoc.id))
        const salasSnapshot = await getDocs(salasQuery)
        let salaId = undefined

        if (!salasSnapshot.empty) {
          salaId = salasSnapshot.docs[0].id
        }

        return {
          id: grupoDoc.id,
          ...grupoData,
          grado: gradoDoc.exists() ? gradoDoc.data() : undefined,
          seccion: seccionDoc.exists() ? seccionDoc.data() : undefined,
          curso: cursoDoc.exists() ? cursoDoc.data() : undefined,
          salaId,
        } as Grupo
      })

      const gruposData = await Promise.all(gruposPromises)
      setGrupos(gruposData)
    } catch (error) {
      console.error("Error al cargar grupos del profesor:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus grupos asignados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const iniciarClase = async (grupoId: string, salaId?: string) => {
    if (!user) return

    setLoading(true)
    try {
      let salaActualId = salaId

      // Si no existe una sala, crearla
      if (!salaActualId) {
        const nuevaSalaRef = await addDoc(collection(db, "salas"), {
          grupoId,
          nombre: `Sala Virtual - ${new Date().toISOString()}`,
          createdAt: new Date().toISOString(),
        })

        salaActualId = nuevaSalaRef.id

        // Actualizar la lista de grupos para incluir la nueva sala
        setGrupos(grupos.map((g) => (g.id === grupoId ? { ...g, salaId: salaActualId } : g)))
      }

      // Crear una nueva sesión de clase
      await addDoc(collection(db, "clases"), {
        salaId: salaActualId,
        grupoId,
        profesorId: user.uid,
        fechaInicio: new Date().toISOString(),
        fechaFin: null,
        estado: "activa",
      })

      toast({
        title: "Clase iniciada",
        description: "La clase virtual ha sido iniciada correctamente.",
      })

      // Redirigir a la sala virtual
      router.push(`/dashboard/profesor/sala/${salaActualId}`)
    } catch (error) {
      console.error("Error al iniciar clase:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar la clase. Intenta nuevamente.",
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
        <h1 className="text-3xl font-bold tracking-tight">Mis Grupos</h1>
        <p className="text-gray-500">Administra tus grupos asignados y clases virtuales.</p>
      </div>

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
            <h3 className="text-xl font-bold mb-2">No tienes grupos asignados</h3>
            <p className="text-gray-500 mb-4">
              Actualmente no tienes grupos asignados. Contacta con el administrador para que te asigne grupos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <Card key={grupo.id}>
              <CardHeader>
                <CardTitle>
                  {grupo.grado?.nombre} "{grupo.seccion?.nombre}" - {grupo.curso?.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <BookOpen className="mr-2 h-4 w-4 text-gray-400" />
                    <span>Curso: {grupo.curso?.nombre}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-gray-400" />
                    <span>
                      Grado: {grupo.grado?.nombre} - Sección: {grupo.seccion?.nombre}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="mr-2 h-4 w-4 text-gray-400" />
                    <span>Año Escolar: {grupo.anioEscolar}</span>
                  </div>

                  <div className="flex flex-col space-y-2 pt-4">
                    <Button onClick={() => iniciarClase(grupo.id, grupo.salaId)}>
                      <Video className="mr-2 h-4 w-4" />
                      Iniciar Clase Virtual
                    </Button>
                    <Link href={`/dashboard/profesor/calificaciones/${grupo.id}`}>
                      <Button variant="outline" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Gestionar Calificaciones
                      </Button>
                    </Link>
                    <Link href={`/dashboard/profesor/alumnos/${grupo.id}`}>
                      <Button variant="outline" className="w-full">
                        <Users className="mr-2 h-4 w-4" />
                        Ver Alumnos
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
