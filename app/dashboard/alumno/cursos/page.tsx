"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { BookOpen, Users, Video, FileText } from "lucide-react"
import Link from "next/link"

interface Grupo {
  id: string
  gradoId?: string
  seccionId?: string
  gradoSeccionId?: string
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
  profesor?: {
    nombre: string
    apellidos: string
  }
  salaId?: string
  claseActiva?: boolean
}

export default function CursosAlumnoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])

  useEffect(() => {
    if (user && user.role !== "alumno") {
      router.push("/dashboard")
    } else if (user) {
      cargarGruposAlumno()
    }
  }, [user, router])

  const cargarGruposAlumno = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Obtener asignaciones del alumno
      const asignacionesRef = collection(db, "asignaciones")
      const q = query(asignacionesRef, where("alumnoId", "==", user.uid))
      const asignacionesSnapshot = await getDocs(q)

      if (asignacionesSnapshot.empty) {
        setGrupos([])
        setLoading(false)
        return
      }

      const gruposIds = asignacionesSnapshot.docs.map((doc) => doc.data().grupoId)

      // Obtener información de cada grupo
      const gruposPromises = gruposIds.map(async (grupoId) => {
        try {
          const grupoDoc = await getDoc(doc(db, "grupos", grupoId))

          if (!grupoDoc.exists()) return null

          const grupoData = grupoDoc.data() as Grupo
          let gradoDoc, seccionDoc

          // Manejar tanto el formato antiguo como el nuevo
          if (grupoData.gradoSeccionId) {
            // Nuevo formato con gradoSeccionId
            const gradoSeccionDoc = await getDoc(doc(db, "gradoSecciones", grupoData.gradoSeccionId))
            if (gradoSeccionDoc.exists()) {
              const gradoSeccionData = gradoSeccionDoc.data()
              gradoDoc = await getDoc(doc(db, "grados", gradoSeccionData.gradoId))
              seccionDoc = await getDoc(doc(db, "secciones", gradoSeccionData.seccionId))
            }
          } else if (grupoData.gradoId && grupoData.seccionId) {
            // Formato antiguo con gradoId y seccionId separados
            gradoDoc = await getDoc(doc(db, "grados", grupoData.gradoId))
            seccionDoc = await getDoc(doc(db, "secciones", grupoData.seccionId))
          }

          const cursoDoc = await getDoc(doc(db, "cursos", grupoData.cursoId))
          const profesorDoc = await getDoc(doc(db, "users", grupoData.profesorId))

          // Obtener la sala virtual asociada al grupo
          const salasRef = collection(db, "salas")
          const salasQuery = query(salasRef, where("grupoId", "==", grupoId))
          const salasSnapshot = await getDocs(salasQuery)
          let salaId = undefined

          if (!salasSnapshot.empty) {
            salaId = salasSnapshot.docs[0].id
          }

          // Verificar si hay una clase activa
          let claseActiva = false
          if (salaId) {
            const clasesRef = collection(db, "clases")
            const clasesQuery = query(clasesRef, where("salaId", "==", salaId), where("estado", "==", "activa"))
            const clasesSnapshot = await getDocs(clasesQuery)
            claseActiva = !clasesSnapshot.empty
          }

          return {
            id: grupoDoc.id,
            ...grupoData,
            grado: gradoDoc?.exists() ? gradoDoc.data() : undefined,
            seccion: seccionDoc?.exists() ? seccionDoc.data() : undefined,
            curso: cursoDoc?.exists() ? cursoDoc.data() : undefined,
            profesor: profesorDoc?.exists() ? profesorDoc.data() : undefined,
            salaId,
            claseActiva,
          } as Grupo
        } catch (error) {
          console.error(`Error al cargar grupo ${grupoId}:`, error)
          return null
        }
      })

      const gruposData = (await Promise.all(gruposPromises)).filter(Boolean) as Grupo[]
      setGrupos(gruposData)
    } catch (error) {
      console.error("Error al cargar grupos del alumno:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus cursos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const entrarAClase = (salaId: string) => {
    router.push(`/dashboard/alumno/sala/${salaId}`)
  }

  if (user?.role !== "alumno") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Cursos</h1>
        <p className="text-gray-500">Accede a tus cursos, clases virtuales y calificaciones.</p>
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
            <h3 className="text-xl font-bold mb-2">No estás inscrito en ningún curso</h3>
            <p className="text-gray-500 mb-4">
              Actualmente no estás inscrito en ningún curso. Contacta con el administrador para que te asigne a un
              grupo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <Card key={grupo.id} className={grupo.claseActiva ? "border-green-500" : ""}>
              <CardHeader>
                <CardTitle>
                  {grupo.curso?.nombre}
                  {grupo.claseActiva && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      En vivo
                    </span>
                  )}
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
                    <span>
                      Profesor: {grupo.profesor?.nombre} {grupo.profesor?.apellidos}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-2 pt-4">
                    {grupo.salaId && (
                      <Button
                        onClick={() => entrarAClase(grupo.salaId!)}
                        disabled={!grupo.claseActiva}
                        className={grupo.claseActiva ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        {grupo.claseActiva ? "Entrar a Clase en Vivo" : "No hay clase activa"}
                      </Button>
                    )}
                    <Link href={`/dashboard/alumno/calificaciones/${grupo.id}`}>
                      <Button variant="outline" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Calificaciones
                      </Button>
                    </Link>
                    <Link href={`/dashboard/alumno/materiales/${grupo.id}`}>
                      <Button variant="outline" className="w-full">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Materiales de Estudio
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
