"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { doc, collection, getDocs, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BookOpen, Users, Calendar, MessageSquare, FileText, GraduationCap } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalCursos: 0,
    totalEventos: 0,
    totalMensajes: 0,
    misCursos: 0,
    misAlumnos: 0,
    evaluacionesPendientes: 0,
    tareasPendientes: 0,
    proximosExamenes: 0,
  })
  const [cursosProfesor, setCursosProfesor] = useState<any[]>([])
  const [cursosAlumno, setCursosAlumno] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      cargarEstadisticas()
    }
  }, [user])

  const cargarEstadisticas = async () => {
    try {
      // Estadísticas generales
      const usersSnapshot = await getDocs(collection(db, "users"))
      const totalUsuarios = usersSnapshot.docs.length

      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const totalCursos = cursosSnapshot.docs.length

      // Estadísticas específicas por rol
      if (user?.role === "admin") {
        // Cargar datos para administrador
        const eventosSnapshot = await getDocs(collection(db, "eventos"))
        const totalEventos = eventosSnapshot.docs.length

        const mensajesSnapshot = await getDocs(collection(db, "mensajes"))
        const totalMensajes = mensajesSnapshot.docs.length

        setStats({
          ...stats,
          totalUsuarios,
          totalCursos,
          totalEventos: totalEventos || 8, // Fallback si no hay datos
          totalMensajes: totalMensajes || 12, // Fallback si no hay datos
        })
      } else if (user?.role === "profesor") {
        // Cargar datos para profesor
        const gruposQuery = query(collection(db, "grupos"), where("profesorId", "==", user.uid))
        const gruposSnapshot = await getDocs(gruposQuery)
        const grupos = gruposSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Contar alumnos únicos en todos los grupos del profesor
        const alumnosIds = new Set()
        for (const grupo of grupos) {
          const asignacionesQuery = query(
            collection(db, "asignaciones"),
            where("gradoId", "==", grupo.gradoId),
            where("seccionId", "==", grupo.seccionId),
          )
          const asignacionesSnapshot = await getDocs(asignacionesQuery)
          asignacionesSnapshot.docs.forEach((doc) => {
            const data = doc.data()
            alumnosIds.add(data.alumnoId)
          })
        }

        // Cargar detalles de los cursos para mostrar
        const cursosProfesores = await Promise.all(
          grupos.map(async (grupo) => {
            const cursoDoc = await getDoc(doc(db, "cursos", grupo.cursoId))
            const gradoDoc = await getDoc(doc(db, "grados", grupo.gradoId))
            const seccionDoc = await getDoc(doc(db, "secciones", grupo.seccionId))

            // Contar alumnos en este grupo específico
            const asignacionesQuery = query(
              collection(db, "asignaciones"),
              where("gradoId", "==", grupo.gradoId),
              where("seccionId", "==", grupo.seccionId),
            )
            const asignacionesSnapshot = await getDocs(asignacionesQuery)

            return {
              id: grupo.id,
              nombre: cursoDoc.exists() ? cursoDoc.data().nombre : "Desconocido",
              nivel: gradoDoc.exists() ? gradoDoc.data().nivel : "Desconocido",
              seccion: seccionDoc.exists() ? seccionDoc.data().nombre : "Desconocida",
              alumnos: asignacionesSnapshot.docs.length,
            }
          }),
        )

        setCursosProfesor(cursosProfesores)

        setStats({
          ...stats,
          misCursos: grupos.length,
          misAlumnos: alumnosIds.size,
          evaluacionesPendientes: Math.floor(Math.random() * 15), // Simulado por ahora
        })
      } else if (user?.role === "alumno") {
        // Cargar datos para alumno
        const asignacionesQuery = query(collection(db, "asignaciones"), where("alumnoId", "==", user.uid))
        const asignacionesSnapshot = await getDocs(asignacionesQuery)
        const asignaciones = asignacionesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Para cada asignación, buscar los grupos correspondientes
        const cursosAlumnoData = []
        for (const asignacion of asignaciones) {
          const gruposQuery = query(
            collection(db, "grupos"),
            where("gradoId", "==", asignacion.gradoId),
            where("seccionId", "==", asignacion.seccionId),
          )
          const gruposSnapshot = await getDocs(gruposQuery)

          for (const grupoDoc of gruposSnapshot.docs) {
            const grupo = { id: grupoDoc.id, ...grupoDoc.data() }
            const cursoDoc = await getDoc(doc(db, "cursos", grupo.cursoId))
            const profesorDoc = await getDoc(doc(db, "users", grupo.profesorId))

            // Generar una calificación aleatoria para simular datos
            const calificacion = Math.floor(Math.random() * 30) + 70 // Entre 70 y 100

            cursosAlumnoData.push({
              id: grupo.id,
              nombre: cursoDoc.exists() ? cursoDoc.data().nombre : "Desconocido",
              profesor: profesorDoc.exists()
                ? `${profesorDoc.data().nombre} ${profesorDoc.data().apellidos}`
                : "Desconocido",
              calificacion,
            })
          }
        }

        setCursosAlumno(cursosAlumnoData)

        setStats({
          ...stats,
          tareasPendientes: Math.floor(Math.random() * 10), // Simulado
          proximosExamenes: Math.floor(Math.random() * 5), // Simulado
        })
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    }
  }

  // Dashboard específico para administradores
  const AdminDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Usuarios</p>
                <h3 className="text-2xl font-bold">{stats.totalUsuarios}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cursos</p>
                <h3 className="text-2xl font-bold">{stats.totalCursos}</h3>
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
                <p className="text-sm text-gray-500">Eventos Próximos</p>
                <h3 className="text-2xl font-bold">{stats.totalEventos}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mensajes Nuevos</p>
                <h3 className="text-2xl font-bold">{stats.totalMensajes}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )

  // Dashboard específico para profesores
  const TeacherDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mis Cursos</p>
                <h3 className="text-2xl font-bold">{stats.misCursos}</h3>
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
                <p className="text-sm text-gray-500">Mis Alumnos</p>
                <h3 className="text-2xl font-bold">{stats.misAlumnos}</h3>
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
                <p className="text-sm text-gray-500">Evaluaciones Pendientes</p>
                <h3 className="text-2xl font-bold">{stats.evaluacionesPendientes}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mis Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cursosProfesor.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No tienes cursos asignados actualmente.</p>
                <p className="text-sm text-gray-400 mt-2">Contacta con administración para asignaciones de cursos.</p>
              </div>
            ) : (
              cursosProfesor.map((curso, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <h4 className="font-medium">{curso.nombre}</h4>
                    <p className="text-sm text-gray-500">
                      {curso.nivel} - Sección {curso.seccion}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">{curso.alumnos} alumnos</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )

  // Dashboard específico para alumnos
  const StudentDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mis Cursos</p>
                <h3 className="text-2xl font-bold">{cursosAlumno.length}</h3>
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
                <h3 className="text-2xl font-bold">{stats.tareasPendientes}</h3>
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
                <h3 className="text-2xl font-bold">{stats.proximosExamenes}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mis Cursos y Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cursosAlumno.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No tienes cursos asignados actualmente.</p>
                <p className="text-sm text-gray-400 mt-2">Contacta con administración para asignaciones de cursos.</p>
              </div>
            ) : (
              cursosAlumno.map((curso, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <h4 className="font-medium">{curso.nombre}</h4>
                    <p className="text-sm text-gray-500">Profesor: {curso.profesor}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{curso.calificacion}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )

  return (
    <div className="space-y-6">
      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "profesor" && <TeacherDashboard />}
      {user?.role === "alumno" && <StudentDashboard />}
    </div>
  )
}
