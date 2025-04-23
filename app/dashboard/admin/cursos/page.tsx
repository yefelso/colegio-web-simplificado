"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, doc, deleteDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2 } from "lucide-react"

interface Curso {
  id: string
  nombre: string
  descripcion: string
}

export default function CursosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cursos, setCursos] = useState<Curso[]>([])

  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: "",
    descripcion: "",
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else {
      cargarCursos()
    }
  }, [user, router])

  const cargarCursos = async () => {
    setLoading(true)
    try {
      const cursosSnapshot = await getDocs(collection(db, "cursos"))
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[]
      setCursos(cursosData)
    } catch (error) {
      console.error("Error al cargar cursos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeCurso = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNuevoCurso((prev) => ({ ...prev, [name]: value }))
  }

  const crearCurso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoCurso.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del curso es obligatorio.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, "cursos"), {
        nombre: nuevoCurso.nombre,
        descripcion: nuevoCurso.descripcion,
      })

      toast({
        title: "Curso creado",
        description: "El curso ha sido creado correctamente.",
      })

      setNuevoCurso({
        nombre: "",
        descripcion: "",
      })

      cargarCursos()
    } catch (error) {
      console.error("Error al crear curso:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el curso. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarCurso = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        await deleteDoc(doc(db, "cursos", id))
        toast({
          title: "Curso eliminado",
          description: "El curso ha sido eliminado correctamente.",
        })
        cargarCursos()
      } catch (error) {
        console.error("Error al eliminar curso:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el curso. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Cursos</h1>
        <p className="text-gray-500">Administra los cursos que se imparten en el colegio.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crearCurso} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Curso</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Matemáticas"
                  value={nuevoCurso.nombre}
                  onChange={handleChangeCurso}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Descripción del curso"
                  value={nuevoCurso.descripcion}
                  onChange={handleChangeCurso}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                {loading ? "Creando..." : "Crear Curso"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cursos Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : cursos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay cursos registrados.</p>
            ) : (
              <div className="space-y-2">
                {cursos.map((curso) => (
                  <div key={curso.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">{curso.nombre}</h4>
                      {curso.descripcion && <p className="text-sm text-gray-500">{curso.descripcion}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarCurso(curso.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
