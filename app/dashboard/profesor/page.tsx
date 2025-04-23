"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileText, Clock, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProfesorDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "profesor") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (user?.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel del Profesor</h1>
        <p className="text-gray-500">Bienvenido, {user?.nombre || user?.email}. Gestiona tus cursos y estudiantes.</p>
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
                <h3 className="text-2xl font-bold">5</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Alumnos</p>
                <h3 className="text-2xl font-bold">128</h3>
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
                <h3 className="text-2xl font-bold">12</h3>
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
                <p className="text-sm text-gray-500">Horas Semanales</p>
                <h3 className="text-2xl font-bold">24</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cursos">
        <TabsList>
          <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
          <TabsTrigger value="alumnos">Mis Alumnos</TabsTrigger>
          <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="cursos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cursos Asignados</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Material
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    nombre: "Matemáticas 3°",
                    nivel: "Secundaria",
                    alumnos: 32,
                    horario: "Lunes y Miércoles, 8:00 - 9:30",
                  },
                  {
                    nombre: "Matemáticas 4°",
                    nivel: "Secundaria",
                    alumnos: 30,
                    horario: "Martes y Jueves, 10:00 - 11:30",
                  },
                  {
                    nombre: "Física 5°",
                    nivel: "Secundaria",
                    alumnos: 28,
                    horario: "Lunes y Viernes, 11:30 - 13:00",
                  },
                  {
                    nombre: "Química 5°",
                    nivel: "Secundaria",
                    alumnos: 28,
                    horario: "Martes y Jueves, 8:00 - 9:30",
                  },
                  {
                    nombre: "Taller de Ciencias",
                    nivel: "Extracurricular",
                    alumnos: 15,
                    horario: "Viernes, 14:00 - 16:00",
                  },
                ].map((curso, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{curso.nombre}</h4>
                      <p className="text-sm text-gray-500">{curso.nivel}</p>
                      <p className="text-xs text-gray-400 mt-1">{curso.horario}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <div className="flex items-center mr-4">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">{curso.alumnos}</span>
                      </div>
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
        <TabsContent value="alumnos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Listado de Alumnos</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Exportar Lista
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nombre: "Ana Martínez", curso: "Matemáticas 3°", asistencia: "95%", promedio: 88 },
                  { nombre: "Carlos López", curso: "Matemáticas 3°", asistencia: "90%", promedio: 76 },
                  { nombre: "Laura Sánchez", curso: "Matemáticas 4°", asistencia: "98%", promedio: 92 },
                  { nombre: "Pedro Ramírez", curso: "Física 5°", asistencia: "85%", promedio: 81 },
                  { nombre: "Sofía Torres", curso: "Química 5°", asistencia: "92%", promedio: 89 },
                ].map((alumno, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{alumno.nombre}</h4>
                      <p className="text-sm text-gray-500">{alumno.curso}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0 space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Asistencia: </span>
                        <span className="font-medium">{alumno.asistencia}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Promedio: </span>
                        <span
                          className={`font-medium ${
                            alumno.promedio >= 90
                              ? "text-green-600"
                              : alumno.promedio >= 80
                                ? "text-blue-600"
                                : alumno.promedio >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                          }`}
                        >
                          {alumno.promedio}/100
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver perfil
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
              <CardTitle>Calificaciones Pendientes</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Calificaciones
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    curso: "Matemáticas 3°",
                    actividad: "Examen Parcial",
                    fecha: "15 Abr, 2024",
                    pendientes: 8,
                  },
                  {
                    curso: "Física 5°",
                    actividad: "Proyecto de Investigación",
                    fecha: "12 Abr, 2024",
                    pendientes: 12,
                  },
                  {
                    curso: "Química 5°",
                    actividad: "Práctica de Laboratorio",
                    fecha: "10 Abr, 2024",
                    pendientes: 5,
                  },
                ].map((calificacion, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{calificacion.curso}</h4>
                      <p className="text-sm text-gray-500">{calificacion.actividad}</p>
                      <p className="text-xs text-gray-400 mt-1">Fecha: {calificacion.fecha}</p>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <div className="flex items-center mr-4">
                        <FileText className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">{calificacion.pendientes} pendientes</span>
                      </div>
                      <Button variant="outline" size="sm">
                        Calificar
                      </Button>
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
