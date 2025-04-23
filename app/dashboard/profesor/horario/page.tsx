"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Clock, Trash2 } from "lucide-react"

interface Horario {
  id: string
  profesorId: string
  dia: string
  horaInicio: string
  horaFin: string
  gradoId: string
  seccionId: string
  cursoId: string
  aula: string
}

interface Grado {
  id: string
  nombre: string
  nivel: string
}

interface Seccion {
  id: string
  nombre: string
  gradoId: string
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
}

export default function HorarioProfesorPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [seccionesFiltradas, setSeccionesFiltradas] = useState<Seccion[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    dia: "",
    horaInicio: "",
    horaFin: "",
    gradoId: "",
    seccionId: "",
    cursoId: "",
    aula: "",
  })

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

  useEffect(() => {
    if (user && user.role !== "profesor") {
      router.push("/dashboard")
    } else if (user) {
      cargarDatos()
    }
  }, [user, router])

  useEffect(() => {
    // Filtrar secciones cuando cambia el grado seleccionado
    if (formData.gradoId) {
      const seccionesPorGrado = secciones.filter((seccion) => seccion.gradoId === formData.gradoId)
      setSeccionesFiltradas(seccionesPorGrado)
      // Resetear la sección seleccionada si no pertenece al grado actual
      if (formData.seccionId && !seccionesPorGrado.some((s) => s.id === formData.seccionId)) {
        setFormData((prev) => ({ ...prev, seccionId: "" }))
      }
    } else {
      setSeccionesFiltradas([])
      setFormData((prev) => ({ ...prev, seccionId: "" }))
    }
  }, [formData.gradoId, secciones])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar horarios del profesor
      const horariosRef = collection(db, "horarios")
      const horariosQuery = query(horariosRef, where("profesorId", "==", user?.uid))
      const horariosSnapshot = await getDocs(horariosQuery)
      const horariosData = horariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Horario[]
      setHorarios(horariosData)

      // Cargar grados
      const gradosSnapshot = await getDocs(collection(db, "grados"))
      const gradosData = gradosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grado[]
      setGrados(gradosData)

      // Cargar secciones
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seccion[]
      setSecciones(seccionesData)

      // Cargar cursos
      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[]
      setCursos(cursosData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del horario.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que todos los campos estén completos
    if (
      !formData.dia ||
      !formData.horaInicio ||
      !formData.horaFin ||
      !formData.gradoId ||
      !formData.seccionId ||
      !formData.cursoId ||
      !formData.aula
    ) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos.",
        variant: "destructive",
      })
      return
    }

    try {
      // Verificar si hay conflicto de horarios
      const conflicto = horarios.some(
        (h) =>
          h.dia === formData.dia &&
          ((formData.horaInicio >= h.horaInicio && formData.horaInicio < h.horaFin) ||
            (formData.horaFin > h.horaInicio && formData.horaFin <= h.horaFin) ||
            (formData.horaInicio <= h.horaInicio && formData.horaFin >= h.horaFin)),
      )

      if (conflicto) {
        toast({
          title: "Conflicto de horarios",
          description: "Ya tienes una clase programada en ese horario.",
          variant: "destructive",
        })
        return
      }

      // Agregar nuevo horario
      const nuevoHorario = {
        profesorId: user?.uid,
        ...formData,
      }

      const docRef = await addDoc(collection(db, "horarios"), nuevoHorario)

      // Actualizar la lista de horarios
      setHorarios([...horarios, { id: docRef.id, ...nuevoHorario } as Horario])

      toast({
        title: "Horario agregado",
        description: "El horario se ha agregado correctamente.",
      })

      // Cerrar el diálogo y resetear el formulario
      setDialogOpen(false)
      setFormData({
        dia: "",
        horaInicio: "",
        horaFin: "",
        gradoId: "",
        seccionId: "",
        cursoId: "",
        aula: "",
      })
    } catch (error) {
      console.error("Error al agregar horario:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el horario.",
        variant: "destructive",
      })
    }
  }

  const eliminarHorario = async (id: string) => {
    try {
      await deleteDoc(doc(db, "horarios", id))
      setHorarios(horarios.filter((h) => h.id !== id))
      toast({
        title: "Horario eliminado",
        description: "El horario se ha eliminado correctamente.",
      })
    } catch (error) {
      console.error("Error al eliminar horario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario.",
        variant: "destructive",
      })
    }
  }

  const obtenerNombreGrado = (gradoId: string) => {
    const grado = grados.find((g) => g.id === gradoId)
    return grado ? grado.nombre : "Desconocido"
  }

  const obtenerNombreSeccion = (seccionId: string) => {
    const seccion = secciones.find((s) => s.id === seccionId)
    return seccion ? seccion.nombre : "Desconocida"
  }

  const obtenerNombreCurso = (cursoId: string) => {
    const curso = cursos.find((c) => c.id === cursoId)
    return curso ? curso.nombre : "Desconocido"
  }

  const horariosPorDia = diasSemana.map((dia) => {
    return {
      dia,
      clases: horarios.filter((h) => h.dia === dia).sort((a, b) => (a.horaInicio > b.horaInicio ? 1 : -1)),
    }
  })

  if (user?.role !== "profesor") {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Horario</h1>
          <p className="text-gray-500">Gestiona tu horario de clases.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Agregar Horario</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : horarios.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tienes horarios asignados</h3>
            <p className="text-gray-500 mb-4">Agrega tus horarios de clase para visualizarlos aquí.</p>
            <Button onClick={() => setDialogOpen(true)}>Agregar Horario</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {horariosPorDia.map(({ dia, clases }) => (
            <Card key={dia} className={clases.length === 0 ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <CardTitle>{dia}</CardTitle>
              </CardHeader>
              <CardContent>
                {clases.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">No hay clases</div>
                ) : (
                  <div className="space-y-3">
                    {clases.map((clase) => (
                      <div key={clase.id} className="rounded-lg border p-3 relative group">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => eliminarHorario(clase.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="font-medium">{obtenerNombreCurso(clase.cursoId)}</div>
                        <div className="text-sm text-gray-500">
                          {clase.horaInicio} - {clase.horaFin}
                        </div>
                        <div className="text-sm text-gray-500">
                          {obtenerNombreGrado(clase.gradoId)} - {obtenerNombreSeccion(clase.seccionId)}
                        </div>
                        <div className="text-sm text-gray-500">Aula: {clase.aula}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Horario</DialogTitle>
            <DialogDescription>Completa los detalles para agregar un nuevo horario.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dia">Día</Label>
                  <Select value={formData.dia} onValueChange={(value) => handleSelectChange("dia", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent>
                      {diasSemana.map((dia) => (
                        <SelectItem key={dia} value={dia}>
                          {dia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aula">Aula</Label>
                  <Input
                    id="aula"
                    name="aula"
                    value={formData.aula}
                    onChange={handleInputChange}
                    placeholder="Ej: A-101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora de inicio</Label>
                  <Input
                    id="horaInicio"
                    name="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora de fin</Label>
                  <Input
                    id="horaFin"
                    name="horaFin"
                    type="time"
                    value={formData.horaFin}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradoId">Grado</Label>
                <Select value={formData.gradoId} onValueChange={(value) => handleSelectChange("gradoId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {grados.map((grado) => (
                      <SelectItem key={grado.id} value={grado.id}>
                        {grado.nombre} - {grado.nivel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seccionId">Sección</Label>
                <Select
                  value={formData.seccionId}
                  onValueChange={(value) => handleSelectChange("seccionId", value)}
                  disabled={!formData.gradoId || seccionesFiltradas.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.gradoId
                          ? "Seleccione un grado primero"
                          : seccionesFiltradas.length === 0
                            ? "No hay secciones para este grado"
                            : "Seleccionar sección"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {seccionesFiltradas.map((seccion) => (
                      <SelectItem key={seccion.id} value={seccion.id}>
                        {seccion.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cursoId">Curso</Label>
                <Select value={formData.cursoId} onValueChange={(value) => handleSelectChange("cursoId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
