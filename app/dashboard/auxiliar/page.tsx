"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { QrCode, Users, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuxiliarDashboard() {
  const { user } = useAuth()
  const [asistenciasHoy, setAsistenciasHoy] = useState(0)
  const [alumnosPresentes, setAlumnosPresentes] = useState(0)
  const [profesoresPresentes, setProfesoresPresentes] = useState(0)
  const [tardanzas, setTardanzas] = useState(0)
  const [ultimasAsistencias, setUltimasAsistencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startOfDay = Timestamp.fromDate(today)

        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)
        const endOfDayTimestamp = Timestamp.fromDate(endOfDay)

        // Consulta para asistencias de hoy
        const asistenciasRef = collection(db, "asistencias")
        const asistenciasQuery = query(
          asistenciasRef,
          where("fecha", ">=", startOfDay),
          where("fecha", "<=", endOfDayTimestamp),
        )
        const asistenciasSnapshot = await getDocs(asistenciasQuery)

        // Contar asistencias
        let alumnosCount = 0
        let profesoresCount = 0
        let tardanzasCount = 0

        asistenciasSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.role === "alumno") alumnosCount++
          if (data.role === "profesor") profesoresCount++

          // Verificar si es tardanza (después de las 8:00 AM)
          const asistenciaHora = data.fecha.toDate().getHours()
          const asistenciaMinutos = data.fecha.toDate().getMinutes()
          if (asistenciaHora > 8 || (asistenciaHora === 8 && asistenciaMinutos > 0)) {
            tardanzasCount++
          }
        })

        setAsistenciasHoy(asistenciasSnapshot.size)
        setAlumnosPresentes(alumnosCount)
        setProfesoresPresentes(profesoresCount)
        setTardanzas(tardanzasCount)

        // Obtener últimas 10 asistencias
        const ultimasAsistenciasQuery = query(asistenciasRef, orderBy("fecha", "desc"), limit(10))
        const ultimasAsistenciasSnapshot = await getDocs(ultimasAsistenciasQuery)
        const ultimasAsistenciasData = ultimasAsistenciasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          fechaFormateada: doc.data().fecha.toDate().toLocaleTimeString(),
        }))

        setUltimasAsistencias(ultimasAsistenciasData)
      } catch (error) {
        console.error("Error al obtener datos del dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const asistenciasPorTipo = [
    { name: "Alumnos", value: alumnosPresentes },
    { name: "Profesores", value: profesoresPresentes },
  ]

  const COLORS = ["#0088FE", "#00C49F"]

  const asistenciasPorHora = [
    { hora: "7:00", cantidad: 5 },
    { hora: "7:30", cantidad: 15 },
    { hora: "8:00", cantidad: 25 },
    { hora: "8:30", cantidad: 10 },
    { hora: "9:00", cantidad: 3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de Auxiliar</h1>
        <p className="text-gray-500">Monitoreo de asistencias y reportes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencias Hoy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asistenciasHoy}</div>
            <p className="text-xs text-muted-foreground">
              {alumnosPresentes} alumnos, {profesoresPresentes} profesores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tardanzas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tardanzas}</div>
            <p className="text-xs text-muted-foreground">
              {((tardanzas / asistenciasHoy) * 100 || 0).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button asChild size="sm">
                <Link href="/dashboard/auxiliar/escanear-qr">Escanear QR</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/auxiliar/alertas">Enviar Alertas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="graficos">
        <TabsList>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="recientes">Asistencias Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="graficos">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asistencias por Hora</CardTitle>
                <CardDescription>Distribución de llegadas durante la mañana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={asistenciasPorHora}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipo de Asistentes</CardTitle>
                <CardDescription>Proporción de alumnos y profesores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={asistenciasPorTipo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {asistenciasPorTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recientes">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Asistencias Registradas</CardTitle>
              <CardDescription>Registros más recientes de entrada al colegio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Nombre</th>
                      <th className="text-left py-2 px-4">Rol</th>
                      <th className="text-left py-2 px-4">Hora</th>
                      <th className="text-left py-2 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasAsistencias.map((asistencia) => {
                      const fecha = new Date(asistencia.fecha.toDate())
                      const hora = fecha.getHours()
                      const minutos = fecha.getMinutes()
                      const esTardanza = hora > 8 || (hora === 8 && minutos > 0)

                      return (
                        <tr key={asistencia.id} className="border-b">
                          <td className="py-2 px-4">
                            {asistencia.nombre} {asistencia.apellidos}
                          </td>
                          <td className="py-2 px-4 capitalize">{asistencia.role}</td>
                          <td className="py-2 px-4">{asistencia.fechaFormateada}</td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${esTardanza ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                            >
                              {esTardanza ? "Tardanza" : "A tiempo"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
