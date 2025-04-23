"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportesAuxiliar() {
  const [periodo, setPeriodo] = useState("semana")
  const [asistenciasPorDia, setAsistenciasPorDia] = useState<any[]>([])
  const [tardanzasPorDia, setTardanzasPorDia] = useState<any[]>([])
  const [distribucionAsistencias, setDistribucionAsistencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReportesData = async () => {
      setLoading(true)
      try {
        // Calcular fechas según el periodo seleccionado
        const today = new Date()
        const startDate = new Date()

        if (periodo === "semana") {
          startDate.setDate(today.getDate() - 7)
        } else if (periodo === "mes") {
          startDate.setMonth(today.getMonth() - 1)
        } else if (periodo === "trimestre") {
          startDate.setMonth(today.getMonth() - 3)
        }

        startDate.setHours(0, 0, 0, 0)
        const startTimestamp = Timestamp.fromDate(startDate)

        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)
        const endTimestamp = Timestamp.fromDate(endOfDay)

        // Consultar asistencias en el periodo
        const asistenciasRef = collection(db, "asistencias")
        const asistenciasQuery = query(
          asistenciasRef,
          where("fecha", ">=", startTimestamp),
          where("fecha", "<=", endTimestamp),
        )

        const asistenciasSnapshot = await getDocs(asistenciasQuery)

        // Procesar datos para gráficos
        const asistenciasPorDiaMap = new Map()
        const tardanzasPorDiaMap = new Map()
        const distribucion = {
          alumnos: 0,
          profesores: 0,
          aTiempo: 0,
          tardanzas: 0,
        }

        asistenciasSnapshot.forEach((doc) => {
          const data = doc.data()
          const fecha = data.fecha.toDate()
          const fechaStr = fecha.toLocaleDateString()

          // Contar asistencias por día
          if (!asistenciasPorDiaMap.has(fechaStr)) {
            asistenciasPorDiaMap.set(fechaStr, 0)
          }
          asistenciasPorDiaMap.set(fechaStr, asistenciasPorDiaMap.get(fechaStr) + 1)

          // Verificar si es tardanza
          const hora = fecha.getHours()
          const minutos = fecha.getMinutes()
          const esTardanza = hora > 8 || (hora === 8 && minutos > 0)

          // Contar tardanzas por día
          if (esTardanza) {
            if (!tardanzasPorDiaMap.has(fechaStr)) {
              tardanzasPorDiaMap.set(fechaStr, 0)
            }
            tardanzasPorDiaMap.set(fechaStr, tardanzasPorDiaMap.get(fechaStr) + 1)
            distribucion.tardanzas++
          } else {
            distribucion.aTiempo++
          }

          // Contar por rol
          if (data.role === "alumno") {
            distribucion.alumnos++
          } else if (data.role === "profesor") {
            distribucion.profesores++
          }
        })

        // Convertir a arrays para los gráficos
        const asistenciasPorDiaArray = Array.from(asistenciasPorDiaMap.entries()).map(([fecha, cantidad]) => ({
          fecha,
          cantidad,
        }))

        const tardanzasPorDiaArray = Array.from(tardanzasPorDiaMap.entries()).map(([fecha, cantidad]) => ({
          fecha,
          cantidad,
        }))

        const distribucionArray = [
          { name: "Alumnos", value: distribucion.alumnos },
          { name: "Profesores", value: distribucion.profesores },
          { name: "A tiempo", value: distribucion.aTiempo },
          { name: "Tardanzas", value: distribucion.tardanzas },
        ]

        setAsistenciasPorDia(asistenciasPorDiaArray)
        setTardanzasPorDia(tardanzasPorDiaArray)
        setDistribucionAsistencias(distribucionArray)
      } catch (error) {
        console.error("Error al obtener datos para reportes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportesData()
  }, [periodo])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes de Asistencia</h1>
          <p className="text-gray-500">Análisis y estadísticas de asistencia escolar</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Vista General</TabsTrigger>
            <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
            <TabsTrigger value="tardanzas">Tardanzas</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Asistencias</CardTitle>
                  <CardDescription>Proporción de asistencias por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionAsistencias.slice(0, 2)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {distribucionAsistencias.slice(0, 2).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Puntualidad</CardTitle>
                  <CardDescription>Proporción de llegadas a tiempo vs tardanzas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribucionAsistencias.slice(2)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {distribucionAsistencias.slice(2).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index + (2 % COLORS.length)]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="asistencias">
            <Card>
              <CardHeader>
                <CardTitle>Asistencias por Día</CardTitle>
                <CardDescription>Número total de asistencias registradas por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={asistenciasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" name="Asistencias" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tardanzas">
            <Card>
              <CardHeader>
                <CardTitle>Tardanzas por Día</CardTitle>
                <CardDescription>Número de tardanzas registradas por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tardanzasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cantidad" name="Tardanzas" stroke="#ef4444" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
