"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, doc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, Eye } from "lucide-react"

interface Grado {
  id: string
  nombre: string
  nivel: string
}

interface Seccion {
  id: string
  nombre: string
}

export default function GradosSeccionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])

  const [nuevoGrado, setNuevoGrado] = useState({
    nombre: "",
    nivel: "primaria",
  })

  const [nuevaSeccion, setNuevaSeccion] = useState({
    nombre: "",
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else {
      cargarGradosYSecciones()
    }
  }, [user, router])

  const cargarGradosYSecciones = async () => {
    setLoading(true)
    try {
      console.log("Cargando grados y secciones...")

      // Cargar grados
      const gradosSnapshot = await getDocs(collection(db, "grados"))
      const gradosData = gradosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Grado[]
      setGrados(gradosData)
      console.log("Grados cargados:", gradosData)

      // Cargar secciones
      const seccionesSnapshot = await getDocs(collection(db, "secciones"))
      const seccionesData = seccionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Seccion[]
      setSecciones(seccionesData)
      console.log("Secciones cargadas:", seccionesData)
    } catch (error) {
      console.error("Error al cargar grados y secciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los grados y secciones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeGrado = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNuevoGrado((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangeSeccion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNuevaSeccion((prev) => ({ ...prev, [name]: value }))
  }

  const crearGrado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoGrado.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del grado es obligatorio.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "grados"), {
        nombre: nuevoGrado.nombre,
        nivel: nuevoGrado.nivel,
      })

      console.log("Grado creado con ID:", docRef.id)

      toast({
        title: "Grado creado",
        description: "El grado ha sido creado correctamente.",
      })

      setNuevoGrado({
        nombre: "",
        nivel: "primaria",
      })

      cargarGradosYSecciones()
    } catch (error) {
      console.error("Error al crear grado:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el grado. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const crearSeccion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaSeccion.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la sección es obligatorio.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "secciones"), {
        nombre: nuevaSeccion.nombre,
      })

      console.log("Sección creada con ID:", docRef.id)

      toast({
        title: "Sección creada",
        description: "La sección ha sido creada correctamente.",
      })

      setNuevaSeccion({
        nombre: "",
      })

      cargarGradosYSecciones()
    } catch (error) {
      console.error("Error al crear sección:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la sección. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarGrado = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este grado? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        // Verificar si hay grupos que usan este grado
        const gruposRef = collection(db, "grupos")
        const q = query(gruposRef, where("gradoId", "==", id))
        const gruposSnapshot = await getDocs(q)

        if (!gruposSnapshot.empty) {
          toast({
            title: "Error",
            description: "No se puede eliminar este grado porque está siendo utilizado por uno o más grupos.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        await deleteDoc(doc(db, "grados", id))
        toast({
          title: "Grado eliminado",
          description: "El grado ha sido eliminado correctamente.",
        })
        cargarGradosYSecciones()
      } catch (error) {
        console.error("Error al eliminar grado:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el grado. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const eliminarSeccion = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta sección? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        // Verificar si hay grupos que usan esta sección
        const gruposRef = collection(db, "grupos")
        const q = query(gruposRef, where("seccionId", "==", id))
        const gruposSnapshot = await getDocs(q)

        if (!gruposSnapshot.empty) {
          toast({
            title: "Error",
            description: "No se puede eliminar esta sección porque está siendo utilizada por uno o más grupos.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        await deleteDoc(doc(db, "secciones", id))
        toast({
          title: "Sección eliminada",
          description: "La sección ha sido eliminada correctamente.",
        })
        cargarGradosYSecciones()
      } catch (error) {
        console.error("Error al eliminar sección:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la sección. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const verDetallesGrado = async (gradoId: string) => {
    try {
      // Verificar que el grado existe antes de navegar
      const gradoDoc = await getDoc(doc(db, "grados", gradoId))
      if (!gradoDoc.exists()) {
        toast({
          title: "Error",
          description: "El grado especificado no existe.",
          variant: "destructive",
        })
        return
      }

      console.log("Navegando a detalles del grado:", gradoId)
      router.push(`/dashboard/admin/grados/${gradoId}`)
    } catch (error) {
      console.error("Error al verificar grado:", error)
      toast({
        title: "Error",
        description: "No se pudo acceder a los detalles del grado.",
        variant: "destructive",
      })
    }
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Grados y Secciones</h1>
        <p className="text-gray-500">Administra los grados y secciones del colegio.</p>
      </div>

      <Tabs defaultValue="grados">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grados">Grados</TabsTrigger>
          <TabsTrigger value="secciones">Secciones</TabsTrigger>
        </TabsList>
        <TabsContent value="grados" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Grado</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={crearGrado} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Grado</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Ej: 1° Grado"
                      value={nuevoGrado.nombre}
                      onChange={handleChangeGrado}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nivel">Nivel</Label>
                    <select
                      id="nivel"
                      name="nivel"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={nuevoGrado.nivel}
                      onChange={handleChangeGrado}
                    >
                      <option value="primaria">Primaria</option>
                      <option value="secundaria">Secundaria</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {loading ? "Creando..." : "Crear Grado"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grados Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : grados.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay grados registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {grados.map((grado) => (
                      <div key={grado.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <h4 className="font-medium">{grado.nombre}</h4>
                          <p className="text-sm text-gray-500 capitalize">{grado.nivel}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetallesGrado(grado.id)}
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarGrado(grado.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="secciones" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Sección</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={crearSeccion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreSeccion">Nombre de la Sección</Label>
                    <Input
                      id="nombreSeccion"
                      name="nombre"
                      placeholder="Ej: A"
                      value={nuevaSeccion.nombre}
                      onChange={handleChangeSeccion}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {loading ? "Creando..." : "Crear Sección"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Secciones Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : secciones.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay secciones registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {secciones.map((seccion) => (
                      <div key={seccion.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <h4 className="font-medium">Sección {seccion.nombre}</h4>
                          <p className="text-xs text-gray-500">ID: {seccion.id}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarSeccion(seccion.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
