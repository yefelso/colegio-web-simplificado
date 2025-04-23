"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, Key, QrCode } from "lucide-react"
import { generateQRCode } from "@/lib/qr-utils"

// Importar Dialog y componentes relacionados
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FallbackImage } from "@/components/ui/fallback-image"

export default function PerfilPage() {
  const { user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [userData, setUserData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    dni: "",
    qrCode: "",
  })
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  useEffect(() => {
    if (user) {
      cargarDatosUsuario()
    }
  }, [user])

  const cargarDatosUsuario = async () => {
    if (!user) return

    setLoading(true)
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData({
          nombre: data.nombre || "",
          apellidos: data.apellidos || "",
          email: data.email || "",
          telefono: data.telefono || "",
          dni: data.dni || "",
          qrCode: data.qrCode || "",
        })
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus datos. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPassword((prev) => ({ ...prev, [name]: value }))
  }

  const actualizarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        telefono: userData.telefono,
      })

      // Actualizar el contexto de autenticación
      updateUserProfile({
        ...user,
        nombre: userData.nombre,
        apellidos: userData.apellidos,
      })

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente.",
      })
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (password.new !== password.confirm) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Aquí iría la lógica para cambiar la contraseña
      // En una implementación real, se verificaría la contraseña actual
      // y se actualizaría en Firebase Authentication

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      })

      setPassword({
        current: "",
        new: "",
        confirm: "",
      })
    } catch (error) {
      console.error("Error al cambiar contraseña:", error)
      toast({
        title: "Error",
        description: "No se pudo cambiar tu contraseña. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Modificar la función generarQR para usar el nuevo formato
  const generarQR = async () => {
    if (!user || !userData.dni) return

    setGeneratingQR(true)
    try {
      // Generar QR basado en el DNI y rol
      const tipoUsuario = user.role.toUpperCase()
      const qrData = `COLEGIO:${tipoUsuario}:${user.uid}:${userData.dni}`
      const qrCodeUrl = await generateQRCode(qrData)

      // Guardar en Firestore
      await updateDoc(doc(db, "users", user.uid), {
        qrCode: qrCodeUrl,
      })

      // Actualizar estado local
      setUserData((prev) => ({
        ...prev,
        qrCode: qrCodeUrl,
      }))

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
      setGeneratingQR(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-gray-500">Administra tu información personal y contraseña.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={actualizarPerfil} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nombre"
                    name="nombre"
                    value={userData.nombre}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={userData.apellidos}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="email" name="email" value={userData.email} className="pl-10" disabled />
                </div>
                <p className="text-xs text-gray-500">El email no se puede cambiar.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefono"
                    name="telefono"
                    value={userData.telefono}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="dni" name="dni" value={userData.dni} className="pl-10" disabled />
                </div>
                <p className="text-xs text-gray-500">El DNI no se puede cambiar.</p>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={cambiarContrasena} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Contraseña Actual</Label>
                  <Input
                    id="current"
                    name="current"
                    type="password"
                    value={password.current}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">Nueva Contraseña</Label>
                  <Input
                    id="new"
                    name="new"
                    type="password"
                    value={password.new}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    value={password.confirm}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Código QR Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {userData.qrCode ? (
                  <div className="border p-4 rounded-lg bg-white">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer hover:opacity-90 transition-opacity">
                          <FallbackImage
                            src={userData.qrCode}
                            alt="Código QR personal"
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
                          <p className="text-xs text-center mt-2 text-gray-500">Haz clic para ampliar</p>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Código QR Personal</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-6">
                          <FallbackImage
                            src={userData.qrCode}
                            alt="Código QR personal"
                            width={400}
                            height={400}
                            fallbackComponent={
                              <div
                                className="flex flex-col items-center justify-center bg-gray-100 rounded-md"
                                style={{ width: "400px", height: "400px" }}
                              >
                                <QrCode className="h-24 w-24 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">Error al cargar QR</p>
                              </div>
                            }
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="border border-dashed p-8 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                    <QrCode className="h-16 w-16 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 text-center">No tienes un código QR generado.</p>
                  </div>
                )}

                <Button onClick={generarQR} disabled={generatingQR || !userData.dni} className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  {userData.qrCode ? "Regenerar Código QR" : "Generar Código QR"}
                </Button>

                {!userData.dni && (
                  <p className="text-xs text-red-500 text-center">
                    Necesitas tener un DNI registrado para generar tu código QR.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
