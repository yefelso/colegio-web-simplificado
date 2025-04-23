"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalificacionesAlumno() {
  const { user } = useAuth()
  const [calificaciones, setCalificaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalificaciones = async () => {
      if (!user?.uid) return

      try {
        // Primero obtenemos los grupos del alumno
        const gruposRef = collection(db, "gruposAlumnos")
        const gruposQuery = query(gruposRef, where("alumnoId", "==", user.uid))
        const gruposSnapshot = await getDocs(gruposQuery)

        const gruposIds = gruposSnapshot.docs.map((doc) => doc.data().grupoId)

        if (gruposIds.length === 0) {
          setLoading(false)
          return
        }

        // Luego obtenemos las calificaciones para esos grupos
        const calificacionesData: any[] = []

        for (const grupoId of gruposIds) {
          const calificacionesRef = collection(db, "calificaciones")
          const calificacionesQuery = query(
            calificacionesRef,
            where("grupoId", "==", grupoId),
            where("alumnoId", "==", user.uid),
          )

          const calificacionesSnapshot = await getDocs(calificacionesQuery)

          // Obtenemos información del grupo
          const gruposRef = collection(db, "grupos")
          const grupoQuery = query(gruposRef, where("id", "==", grupoId))
          const grupoSnapshot = await getDocs(grupoQuery)
          const grupoData = grupoSnapshot.docs[0]?.data()

          // Obtenemos información del curso
          const cursosRef = collection(db, "cursos")
          const cursoQuery = query(cursosRef, where("id", "==", grupoData?.cursoId))
          const cursoSnapshot = await getDocs(cursoQuery)
          const cursoData = cursoSnapshot.docs[0]?.data()

          calificacionesSnapshot.forEach((doc) => {
            calificacionesData.push({
              id: doc.id,
              ...doc.data(),
              nombreCurso: cursoData?.nombre || "Curso sin nombre",
              grupo: grupoData,
            })
          })
        }

        setCalificaciones(calificacionesData)
      } catch (error) {
        console.error("Error al obtener calificaciones:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalificaciones()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (calificaciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calificaciones</CardTitle>
          <CardDescription>No tienes calificaciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Aún no se han registrado calificaciones para tus cursos. Consulta con tu profesor para más información.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Agrupar calificaciones por curso
  const calificacionesPorCurso = calificaciones.reduce((acc, calificacion) => {
    const cursoId = calificacion.grupo.cursoId
    if (!acc[cursoId]) {
      acc[cursoId] = {
        nombreCurso: calificacion.nombreCurso,
        calificaciones: [],
      }
    }
    acc[cursoId].calificaciones.push(calificacion)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Calificaciones</h1>
        <p className="text-gray-500">Consulta tus calificaciones por curso</p>
      </div>

      <Tabs defaultValue={Object.keys(calificacionesPorCurso)[0] || "tab1"}>
        <TabsList className="mb-4">
          {Object.entries(calificacionesPorCurso).map(([cursoId, data]: [string, any]) => (
            <TabsTrigger key={cursoId} value={cursoId}>
              {data.nombreCurso}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(calificacionesPorCurso).map(([cursoId, data]: [string, any]) => (
          <TabsContent key={cursoId} value={cursoId}>
            <Card>
              <CardHeader>
                <CardTitle>{data.nombreCurso}</CardTitle>
                <CardDescription>Calificaciones del curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Evaluación</th>
                        <th className="py-2 px-4 text-left">Fecha</th>
                        <th className="py-2 px-4 text-left">Calificación</th>
                        <th className="py-2 px-4 text-left">Comentarios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.calificaciones.map((calificacion: any) => (
                        <tr key={calificacion.id} className="border-b">
                          <td className="py-2 px-4">{calificacion.evaluacion || "Sin título"}</td>
                          <td className="py-2 px-4">
                            {calificacion.fecha
                              ? new Date(calificacion.fecha.toDate()).toLocaleDateString()
                              : "Sin fecha"}
                          </td>
                          <td className="py-2 px-4 font-medium">
                            {calificacion.valor !== undefined ? calificacion.valor : "Sin calificar"}
                          </td>
                          <td className="py-2 px-4">{calificacion.comentarios || "Sin comentarios"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
