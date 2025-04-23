"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Search, Download } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function AsistenciasAuxiliar() {
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [filteredAsistencias, setFilteredAsistencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [tipoFiltro, setTipoFiltro] = useState("todos")

  useEffect(() => {
    const fetchAsistencias = async () => {
      try {
        if (!date) return

        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const startTimestamp = Timestamp.fromDate(startOfDay)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        const endTimestamp = Timestamp.fromDate(endOfDay)

        const asistenciasRef = collection(db, "asistencias")
        const asistenciasQuery = query(
          asistenciasRef,
          where("fecha", ">=", startTimestamp),
          where("fecha", "<=", endTimestamp),
          orderBy("fecha", "asc"),
        )

        const asistenciasSnapshot = await getDocs(asistenciasQuery)
        const asistenciasData = asistenciasSnapshot.docs.map((doc) => {
          const data = doc.data()
          const fecha = data.fecha.toDate()
          const hora = fecha.getHours()
          const minutos = fecha.getMinutes()
          const esTardanza = hora > 8 || (hora === 8 && minutos > 0)

          return {
            id: doc.id,
            ...data,
            fechaFormateada: fecha.toLocaleTimeString(),
            esTardanza,
          }
        })

        setAsistencias(asistenciasData)
        setFilteredAsistencias(asistenciasData)
      } catch (error) {
        console.error("Error al obtener asistencias:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAsistencias()
  }, [date])

  useEffect(() => {
    // Filtrar por búsqueda y tipo
    let filtered = asistencias

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          (a.nombre && a.nombre.toLowerCase().includes(term)) ||
          (a.apellidos && a.apellidos.toLowerCase().includes(term)),
      )
    }

    if (tipoFiltro !== "todos") {
      if (tipoFiltro === "alumnos") {
        filtered = filtered.filter((a) => a.role === "alumno")
      } else if (tipoFiltro === "profesores") {
        filtered = filtered.filter((a) => a.role === "profesor")
      } else if (tipoFiltro === "tardanzas") {
        filtered = filtered.filter((a) => a.esTardanza)
      } else if (tipoFiltro === "a-tiempo") {
        filtered = filtered.filter((a) => !a.esTardanza)
      }
    }

    setFilteredAsistencias(filtered)
  }, [searchTerm, tipoFiltro, asistencias])

  const exportarCSV = () => {
    if (filteredAsistencias.length === 0) return

    const headers = ["Nombre", "Apellidos", "Rol", "Hora", "Estado"]
    const csvContent = [
      headers.join(","),
      ...filteredAsistencias.map((a) =>
        [
          a.nombre || "",
          a.apellidos || "",
          a.role || "",
          a.fechaFormateada || "",
          a.esTardanza ? "Tardanza" : "A tiempo",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fechaStr = format(date || new Date(), "yyyy-MM-dd")

    link.setAttribute("href", url)
    link.setAttribute("download", `asistencias_${fechaStr}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de Asistencias</h1>
        <p className="text-gray-500">Consulta y gestiona las asistencias diarias</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por nombre..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button variant="outline" onClick={exportarCSV} disabled={filteredAsistencias.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <Tabs defaultValue="todos" onValueChange={setTipoFiltro}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="profesores">Profesores</TabsTrigger>
          <TabsTrigger value="tardanzas">Tardanzas</TabsTrigger>
          <TabsTrigger value="a-tiempo">A tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value={tipoFiltro}>
          <Card>
            <CardHeader>
              <CardTitle>Asistencias {format(date || new Date(), "PPP", { locale: es })}</CardTitle>
              <CardDescription>{filteredAsistencias.length} registros encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : filteredAsistencias.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay registros de asistencia para mostrar</div>
              ) : (
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
                      {filteredAsistencias.map((asistencia) => (
                        <tr key={asistencia.id} className="border-b">
                          <td className="py-2 px-4">
                            {asistencia.nombre} {asistencia.apellidos}
                          </td>
                          <td className="py-2 px-4 capitalize">{asistencia.role}</td>
                          <td className="py-2 px-4">{asistencia.fechaFormateada}</td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${asistencia.esTardanza ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                            >
                              {asistencia.esTardanza ? "Tardanza" : "A tiempo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
