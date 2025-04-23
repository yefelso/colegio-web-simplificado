"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { Asistencia } from "@/lib/models/asistencia"

export default function AsistenciasAlumnoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [stats, setStats] = useState({
    total: 0,
    presentes: 0,
    ausentes: 0,
    tardanzas: 0,
  })

  useEffect(() => {
    if (user && user.role !== "alumno") {
      router.push("/dashboard")
    } else if (user) {
      cargarAsistencias()
    }
  }, [user, router])

  const cargarAsistencias = async () => {
    if (!user) return

    setLoading(true)
    try {
      const asistenciasRef = collection(db, "asistencias")
      const q = query(
        asistenciasRef,
        where("alumnoId", "==", user.uid),
        orderBy("fecha", "desc"),
        orderBy("hora", "desc"),
      )
      const asistenciasSnapshot = await getDocs(q)

      if (asistenciasSnapshot.empty) {
        setAsistencias([])
        setStats({
          total: 0,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0,
        })
        setLoading(false)
        return
      }

      const asistenciasData = asistenciasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asistencia[]

      // Calcular estadísticas
      const presentes = asistenciasData.filter((a) => a.estado === "presente").length
      const ausentes = asistenciasData.filter((a) => a.estado === "ausente").length
      const tardanzas = asistenciasData.filter((a) => a.estado === "tardanza").length

      setAsistencias(asistenciasData)
      setStats({
        total: asistenciasData.length,
        presentes,
        ausentes,
        tardanzas,
      })
    } catch (error) {
      console.error("Error al cargar asistencias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus asistencias.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "alumno") {
    return null
  }

  const porcentajeAsistencia = stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Asistencias</h1>
        <p className="text-gray-500">Consulta tu registro de asistencias a clases.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Registros</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Asistencias</p>
                <h3 className="text-2xl font-bold">{stats.presentes}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ausencias</p>
                <h3 className="text-2xl font-bold">{stats.ausentes}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tardanzas</p>
                <h3 className="text-2xl font-bold">{stats.tardanzas}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Registro de Asistencias</span>
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                porcentajeAsistencia >= 90
                  ? "bg-green-100 text-green-800"
                  : porcentajeAsistencia >= 75
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {porcentajeAsistencia}% de asistencia
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : asistencias.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay registros de asistencia</h3>
              <p className="text-gray-500">Aún no se ha registrado ninguna asistencia para ti.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {asistencias.map((asistencia) => (
                <div key={asistencia.id} className="flex justify-between items-center p-4 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`rounded-full p-2 ${
                        asistencia.estado === "presente"
                          ? "bg-green-100"
                          : asistencia.estado === "ausente"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      {asistencia.estado === "presente" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : asistencia.estado === "ausente" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {asistencia.estado === "presente"
                          ? "Presente"
                          : asistencia.estado === "ausente"
                            ? "Ausente"
                            : "Tardanza"}
                      </p>
                      {asistencia.observaciones && <p className="text-sm text-gray-500">{asistencia.observaciones}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(asistencia.fecha).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{asistencia.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
