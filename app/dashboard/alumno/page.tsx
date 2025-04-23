"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Calendar, Clock, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AlumnoDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "alumno") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (user?.role !== "alumno") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portal del Estudiante</h1>
        <p className="text-gray-500">
          Bienvenido, {user?.nombre || user?.email}. Accede a tus cursos y calificaciones.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mis Cursos</p>
                <h3 className="text-2xl font-bold">8</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tareas Pendientes</p>
                <h3 className="text-2xl font-bold">5</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Próximos Exámenes</p>
                <h3 className="text-2xl font-bold">3</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Asistencia</p>
                <h3 className="text-2xl font-bold">95%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cursos">
        <TabsList>
          <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="cursos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Matriculados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    nombre: "Matemáticas",
                    profesor: "Juan Pérez",
                    horario: "Lunes y Miércoles, 8:00 - 9:30",
                    progreso: 75,
                  },
                  {
                    nombre: "Lenguaje",
                    profesor: "Ana Gómez",
                    horario: "Martes y Jueves, 10:00 - 11:30",
                    progreso: 80,
                  },
                  {
                    nombre: "Historia",
                    profesor: "Carlos Rodríguez",
                    horario: "Lunes y Viernes, 11:30 - 13:00",
                    progreso: 60,
                  },
                  {
                    nombre: "Ciencias",
                    profesor: "Laura Martínez",
                    horario: "Martes y Jueves, 8:00 - 9:30",
                    progreso: 85,
                  },
                  {
                    nombre: "Inglés",
                    profesor: "Roberto Sánchez",
                    horario: "Miércoles y Viernes, 10:00 - 11:30",
                    progreso: 90,
                  },
                ].map((curso, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{curso.nombre}</h4>
                      <p className="text-sm text-gray-500">Prof. {curso.profesor}</p>
                      <p className="text-xs text-gray-400 mt-1">{curso.horario}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <div className="flex items-center mr-4">
                        <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${curso.progreso}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{curso.progreso}%</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver curso
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tareas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tareas Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    titulo: "Ejercicios de Álgebra",
                    curso: "Matemáticas",
                    fechaEntrega: "20 Abr, 2024",
                    estado: "pendiente",
                  },
                  {
                    titulo: "Ensayo sobre Literatura Contemporánea",
                    curso: "Lenguaje",
                    fechaEntrega: "22 Abr, 2024",
                    estado: "pendiente",
                  },
                  {
                    titulo: "Investigación sobre la Revolución Industrial",
                    curso: "Historia",
                    fechaEntrega: "25 Abr, 2024",
                    estado: "pendiente",
                  },
                  {
                    titulo: "Informe de Laboratorio",
                    curso: "Ciencias",
                    fechaEntrega: "18 Abr, 2024",
                    estado: "pendiente",
                  },
                  {
                    titulo: "Presentación Oral",
                    curso: "Inglés",
                    fechaEntrega: "27 Abr, 2024",
                    estado: "pendiente",
                  },
                ].map((tarea, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{tarea.titulo}</h4>
                      <p className="text-sm text-gray-500">{tarea.curso}</p>
                      <p className="text-xs text-gray-400 mt-1">Entrega: {tarea.fechaEntrega}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium mr-4 ${
                          tarea.estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : tarea.estado === "entregado"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {tarea.estado === "pendiente"
                          ? "Pendiente"
                          : tarea.estado === "entregado"
                            ? "Entregado"
                            : "Calificado"}
                      </span>
                      <Button variant="outline" size="sm">
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calificaciones" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mis Calificaciones</CardTitle>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar Boletín
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { curso: "Matemáticas", profesor: "Juan Pérez", calificacion: 85, periodo: "1er Trimestre" },
                  { curso: "Lenguaje", profesor: "Ana Gómez", calificacion: 92, periodo: "1er Trimestre" },
                  { curso: "Historia", profesor: "Carlos Rodríguez", calificacion: 78, periodo: "1er Trimestre" },
                  { curso: "Ciencias", profesor: "Laura Martínez", calificacion: 88, periodo: "1er Trimestre" },
                  { curso: "Inglés", profesor: "Roberto Sánchez", calificacion: 90, periodo: "1er Trimestre" },
                  { curso: "Educación Física", profesor: "María López", calificacion: 95, periodo: "1er Trimestre" },
                  { curso: "Arte", profesor: "Javier Torres", calificacion: 89, periodo: "1er Trimestre" },
                  { curso: "Música", profesor: "Sofía Ramírez", calificacion: 91, periodo: "1er Trimestre" },
                ].map((curso, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{curso.curso}</h4>
                      <p className="text-sm text-gray-500">Prof. {curso.profesor}</p>
                      <p className="text-xs text-gray-400 mt-1">{curso.periodo}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <span
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          curso.calificacion >= 90
                            ? "bg-green-100 text-green-800"
                            : curso.calificacion >= 80
                              ? "bg-blue-100 text-blue-800"
                              : curso.calificacion >= 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {curso.calificacion}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
