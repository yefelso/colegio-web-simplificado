"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { User, UserPlus, Trash2, QrCode, ListFilter, Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FallbackImage } from "@/components/ui/fallback-image"
import { generateQRCode } from "@/lib/qr-utils"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, deleteUser } from "firebase/auth"
import { auth, secondaryAuth } from "@/lib/firebase"

interface Usuario {
  id: string
  nombre: string
  apellidos: string
  email: string
  password: string
  role: string
  dni: string
  qrCode?: string
}

export default function UsuariosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filtro, setFiltro] = useState("")
  const [rolFiltro, setRolFiltro] = useState("todos")
  const [showPassword, setShowPassword] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    role: "alumno",
    dni: "",
  })
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [generandoQR, setGenerandoQR] = useState(false)
  const [activeTab, setActiveTab] = useState("lista")

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    } else {
      cargarUsuarios()
    }
  }, [user, router])

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const usuariosSnapshot = await getDocs(collection(db, "users"))
      const usuariosData = usuariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Usuario[]
      setUsuarios(usuariosData)
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeNuevoUsuario = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }))
  }

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !nuevoUsuario.nombre ||
      !nuevoUsuario.apellidos ||
      !nuevoUsuario.email ||
      !nuevoUsuario.password ||
      !nuevoUsuario.dni
    ) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Crear usuario en Firebase Authentication usando la instancia secundaria
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        nuevoUsuario.email,
        nuevoUsuario.password
      )
      const uid = userCredential.user.uid

      // Desconectar inmediatamente la instancia secundaria
      await secondaryAuth.signOut()

      // Generar QR basado en el DNI
      const qrData = `COLEGIO:${nuevoUsuario.role.toUpperCase()}:${uid}:${nuevoUsuario.dni}`
      const qrCodeUrl = await generateQRCode(qrData)

      // Crear usuario en Firestore con todos los datos necesarios
      await setDoc(doc(db, "users", uid), {
        uid,
        nombre: nuevoUsuario.nombre,
        apellidos: nuevoUsuario.apellidos,
        email: nuevoUsuario.email,
        role: nuevoUsuario.role,
        dni: nuevoUsuario.dni,
        qrCode: qrCodeUrl,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente.",
      })

      // Limpiar el formulario completamente
      setNuevoUsuario({
        nombre: "",
        apellidos: "",
        email: "",
        password: "",
        role: "alumno",
        dni: "",
      })
      setShowPassword(false)

      // Recargar la lista y cambiar a la pestaña de lista
      await cargarUsuarios()
      setActiveTab("lista")
    } catch (error: any) {
      console.error("Error al crear usuario:", error)
      let errorMessage = "No se pudo crear el usuario. Intenta nuevamente."
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "El correo electrónico ya está en uso. Intenta con otro correo."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarUsuario = async (id: string, email: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      setLoading(true)
      try {
        // Primero eliminar de Firestore
        await deleteDoc(doc(db, "users", id))

        // Luego intentar eliminar de Firebase Authentication
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, "temporaryPassword")
          await deleteUser(userCredential.user)
        } catch (error) {
          console.log("Usuario no encontrado en Firebase Auth")
        }

        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado correctamente.",
        })
        cargarUsuarios()
      } catch (error) {
        console.error("Error al eliminar usuario:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const generarQRUsuario = async (usuario: Usuario) => {
    if (!usuario.dni) {
      toast({
        title: "Error",
        description: "El usuario debe tener un DNI para generar un código QR.",
        variant: "destructive",
      })
      return
    }

    setUsuarioSeleccionado(usuario)
    setGenerandoQR(true)

    try {
      const tipoUsuario = usuario.role.toUpperCase()
      const qrData = `COLEGIO:${tipoUsuario}:${usuario.id}:${usuario.dni}`
      const qrCodeUrl = await generateQRCode(qrData)

      await updateDoc(doc(db, "users", usuario.id), {
        qrCode: qrCodeUrl,
      })

      setUsuarios(usuarios.map((u) => (u.id === usuario.id ? { ...u, qrCode: qrCodeUrl } : u)))
      setUsuarioSeleccionado({ ...usuario, qrCode: qrCodeUrl })

      toast({
        title: "QR generado",
        description: "El código QR ha sido generado y guardado correctamente.",
      })
    } catch (error) {
      console.error("Error al generar QR:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el código QR. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setGenerandoQR(false)
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const coincideFiltro =
      usuario.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      usuario.apellidos.toLowerCase().includes(filtro.toLowerCase()) ||
      usuario.email.toLowerCase().includes(filtro.toLowerCase()) ||
      usuario.dni.toLowerCase().includes(filtro.toLowerCase())

    const coincideRol = rolFiltro === "todos" || usuario.role === rolFiltro

    return coincideFiltro && coincideRol
  })

  if (user?.role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-gray-500">Administra los usuarios del sistema.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="lista" className="flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              Lista de Usuarios
            </TabsTrigger>
            <TabsTrigger value="crear" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="crear">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={crearUsuario} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={nuevoUsuario.nombre}
                      onChange={handleChangeNuevoUsuario}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      name="apellidos"
                      value={nuevoUsuario.apellidos}
                      onChange={handleChangeNuevoUsuario}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={nuevoUsuario.email}
                      onChange={handleChangeNuevoUsuario}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={nuevoUsuario.password}
                        onChange={handleChangeNuevoUsuario}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <select
                      id="role"
                      name="role"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={nuevoUsuario.role}
                      onChange={handleChangeNuevoUsuario}
                    >
                      <option value="alumno">Alumno</option>
                      <option value="profesor">Profesor</option>
                      <option value="auxiliar">Auxiliar</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input id="dni" name="dni" value={nuevoUsuario.dni} onChange={handleChangeNuevoUsuario} required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? "Creando..." : "Crear Usuario"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por nombre, apellido, email o DNI..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                    />
                  </div>
                  <select
                    className="rounded-md border border-gray-300 p-2"
                    value={rolFiltro}
                    onChange={(e) => setRolFiltro(e.target.value)}
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="alumno">Alumnos</option>
                    <option value="profesor">Profesores</option>
                    <option value="auxiliar">Auxiliares</option>
                    <option value="admin">Administradores</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No se encontraron usuarios</h3>
                    <p className="text-gray-500">No hay usuarios que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Nombre
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            DNI
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Rol
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            QR
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usuariosFiltrados.map((usuario) => (
                          <tr key={usuario.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {usuario.nombre} {usuario.apellidos}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{usuario.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{usuario.dni}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  usuario.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : usuario.role === "profesor"
                                      ? "bg-green-100 text-green-800"
                                      : usuario.role === "auxiliar"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {usuario.role === "admin"
                                  ? "Administrador"
                                  : usuario.role === "profesor"
                                    ? "Profesor"
                                    : usuario.role === "auxiliar"
                                      ? "Auxiliar"
                                      : "Alumno"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setUsuarioSeleccionado(usuario)}>
                                    <QrCode className="h-4 w-4 mr-1" />
                                    {usuario.qrCode ? "Ver QR" : "Generar QR"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Código QR de Usuario</DialogTitle>
                                    <DialogDescription>
                                      {usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellidos} -{" "}
                                      {usuarioSeleccionado?.dni}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex flex-col items-center justify-center py-4">
                                    {usuarioSeleccionado?.qrCode ? (
                                      <div className="border p-4 rounded-lg bg-white">
                                        <FallbackImage
                                          src={usuarioSeleccionado.qrCode}
                                          alt="Código QR del usuario"
                                          width={200}
                                          height={200}
                                          fallbackComponent={
                                            <div
                                              className="flex flex-col items-center justify-center bg-gray-100 rounded-md"
                                              style={{ width: "200px", height: "200px" }}
                                            >
                                              <QrCode className="h-16 w-16 text-gray-300 mb-2" />
                                              <p className="text-sm text-gray-500">Error al cargar QR</p>
                                            </div>
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="border border-dashed p-8 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                                        <QrCode className="h-16 w-16 text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-500 text-center">
                                          Este usuario no tiene un código QR generado.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    {!usuarioSeleccionado?.qrCode && (
                                      <Button
                                        onClick={() => usuarioSeleccionado && generarQRUsuario(usuarioSeleccionado)}
                                        disabled={generandoQR}
                                      >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        {generandoQR ? "Generando..." : "Generar QR"}
                                      </Button>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarUsuario(usuario.id, usuario.email)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}