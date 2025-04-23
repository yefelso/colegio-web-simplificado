"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, getDoc, doc, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Video, Calendar, Users } from "lucide-react"

interface Sala {
  id: string
  nombre: string
  grupoId: string
  creadorId: string
  fechaCreacion: string
  grupo?: {
    gradoId: string
    seccionId: string
    cursoId: string
    profesorId: string
    grado?: {
      nombre: string
    }
    seccion?: {
      nombre: string
    }
    curso?: {
      nombre: string
    }
  }
}

export default function ClasesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [salas, setSalas] = useState<Sala[]>([])

  useEffect(() => {
    if (user) {
      cargarSalas()
    }
  }, [user])

  const cargarSalas = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Inicializar la colección de salas si no existe
      const salasRef = collection(db, "salas")

      // Obtener todas las salas (para simplificar)
      const salasSnapshot = await getDocs(salasRef)

      if (salasSnapshot.empty) {
        setSalas([])
        setLoading(false)
        return
      }

      const salasPromises = salasSnapshot.docs.map(async (docSnapshot) => {
        const salaData = docSnapshot.data()
        let grupoData = null

        // Verificar si existe el grupoId antes de intentar obtener datos
        if (salaData.grupoId) {
          try {
            const grupoDocRef = doc(db, "grupos", salaData.grupoId)
            const grupoDocSnap = await getDoc(grupoDocRef)

            if (grupoDocSnap.exists()) {
              const grupo = grupoDocSnap.data()

              // Obtener información adicional si existen los IDs
              let gradoData = undefined
              let seccionData = undefined
              let cursoData = undefined

              if (grupo.gradoId) {
                const gradoDocRef = doc(db, "grados", grupo.gradoId)
                const gradoDocSnap = await getDoc(gradoDocRef)
                if (gradoDocSnap.exists()) {
                  gradoData = gradoDocSnap.data()
                }
              }

              if (grupo.seccionId) {
                const seccionDocRef = doc(db, "secciones", grupo.seccionId)
                const seccionDocSnap = await getDoc(seccionDocRef)
                if (seccionDocSnap.exists()) {
                  seccionData = seccionDocSnap.data()
                }
              }

              if (grupo.cursoId) {
                const cursoDocRef = doc(db, "cursos", grupo.cursoId)
                const cursoDocSnap = await getDoc(cursoDocRef)
                if (cursoDocSnap.exists()) {
                  cursoData = cursoDocSnap.data()
                }
              }

              grupoData = {
                ...grupo,
                grado: gradoData,
                seccion: seccionData,
                curso: cursoData,
              }
            }
          } catch (error) {
            console.error("Error al obtener datos del grupo:", error)
          }
        }

        return {
          id: docSnapshot.id,
          ...salaData,
          grupo: grupoData,
          // Asegurar que fechaCreacion siempre tenga un valor
          fechaCreacion: salaData.fechaCreacion || new Date().toISOString(),
        } as Sala
      })

      const salasData = await Promise.all(salasPromises)

      // Filtrar salas según el rol del usuario
      let salasFiltradas = salasData

      if (user.role === "profesor") {
        salasFiltradas = salasData.filter(
          (sala) => sala.creadorId === user.uid || (sala.grupo && sala.grupo.profesorId === user.uid),
        )
      } else if (user.role === "alumno") {
        // Obtener los grupos del alumno
        const asignacionesRef = collection(db, "asignaciones")
        const asignacionesQuery = query(asignacionesRef, where("alumnoId", "==", user.uid))
        const asignacionesSnapshot = await getDocs(asignacionesQuery)

        if (!asignacionesSnapshot.empty) {
          const gruposIds = asignacionesSnapshot.docs.map((doc) => doc.data().grupoId)
          salasFiltradas = salasData.filter(
            (sala) => sala.grupo && gruposIds.includes(sala.grupo.grupoId || sala.grupoId),
          )
        } else {
          salasFiltradas = []
        }
      }

      setSalas(salasFiltradas)
    } catch (error) {
      console.error("Error al cargar salas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las salas virtuales. Detalles: " + (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const crearSalaVirtual = async () => {
    if (!user || user.role !== "profesor") return

    setLoading(true)
    try {
      // Obtener grupos del profesor
      const gruposRef = collection(db, "grupos")
      const gruposQuery = query(gruposRef, where("profesorId", "==", user.uid))
      const gruposSnapshot = await getDocs(gruposQuery)

      if (gruposSnapshot.empty) {
        toast({
          title: "Error",
          description: "No tienes grupos asignados para crear una sala virtual.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Usar el primer grupo para la sala (en una implementación real, se debería permitir elegir)
      const grupoId = gruposSnapshot.docs[0].id
      const grupoData = gruposSnapshot.docs[0].data()

      // Obtener información del curso
      let cursoNombre = "Clase"
      try {
        const cursoDocRef = doc(db, "cursos", grupoData.cursoId)
        const cursoDocSnap = await getDoc(cursoDocRef)
        if (cursoDocSnap.exists()) {
          cursoNombre = cursoDocSnap.data().nombre
        }
      } catch (error) {
        console.error("Error al obtener curso:", error)
      }

      // Crear la sala
      const nuevaSalaRef = await addDoc(collection(db, "salas"), {
        nombre: `${cursoNombre} - Clase Virtual`,
        grupoId,
        creadorId: user.uid,
        fechaCreacion: serverTimestamp(),
      })

      toast({
        title: "Sala creada",
        description: "La sala virtual ha sido creada correctamente.",
      })

      // Redirigir a la sala
      router.push(`/dashboard/sala-virtual/${nuevaSalaRef.id}`)
    } catch (error) {
      console.error("Error al crear sala:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la sala virtual. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const entrarSala = (salaId: string) => {
    router.push(`/dashboard/sala-virtual/${salaId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clases Virtuales</h1>
          <p className="text-gray-500">Accede a tus clases virtuales en tiempo real.</p>
        </div>
        {user?.role === "profesor" && (
          <Button onClick={crearSalaVirtual} disabled={loading}>
            <Video className="mr-2 h-4 w-4" />
            Nueva Clase Virtual
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : salas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay clases virtuales disponibles</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              {user?.role === "profesor"
                ? "Crea una nueva clase virtual para comenzar a enseñar en línea."
                : "Actualmente no tienes clases virtuales disponibles."}
            </p>
            {user?.role === "profesor" && (
              <Button onClick={crearSalaVirtual}>
                <Video className="mr-2 h-4 w-4" />
                Crear Clase Virtual
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {salas.map((sala) => (
            <Card
              key={sala.id}
              className="h-full cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => entrarSala(sala.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{sala.nombre || "Clase Virtual"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sala.grupo && (
                    <>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span>
                          {sala.grupo.grado?.nombre || "Grado"} "{sala.grupo.seccion?.nombre || "Sección"}"
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Video className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{sala.grupo.curso?.nombre || "Curso"}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Creada: {new Date(sala.fechaCreacion).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4">
                    <Button className="w-full">
                      <Video className="mr-2 h-4 w-4" />
                      Entrar a la Clase
                    </Button>
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
