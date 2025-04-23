"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Moon, Sun, Save } from "lucide-react"

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [configuracion, setConfiguracion] = useState({
    tema: "claro",
    notificaciones: {
      email: true,
      sistema: true,
      nuevosEventos: true,
      nuevasMensajes: true,
      nuevasCalificaciones: true,
    },
    privacidad: {
      perfilPublico: false,
      mostrarEmail: false,
      mostrarUltimaConexion: true,
    },
  })

  const handleChangeConfiguracion = (seccion: string, campo: string, valor: boolean | string) => {
    setConfiguracion((prev) => ({
      ...prev,
      [seccion]: {
        ...prev[seccion as keyof typeof prev],
        [campo]: valor,
      },
    }))
  }

  const guardarConfiguracion = () => {
    setLoading(true)

    // Simulación de guardado - en una aplicación real, esto se guardaría en la base de datos
    setTimeout(() => {
      toast({
        title: "Configuración guardada",
        description: "Tus preferencias han sido actualizadas correctamente.",
      })
      setLoading(false)
    }, 1000)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-gray-500">Administra tus preferencias y configuración de la cuenta.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="privacidad">Privacidad</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Tema</h3>
                    <p className="text-sm text-gray-500">Selecciona el tema de la aplicación</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={configuracion.tema === "claro" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfiguracion((prev) => ({ ...prev, tema: "claro" }))}
                      className="flex items-center"
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      Claro
                    </Button>
                    <Button
                      variant={configuracion.tema === "oscuro" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfiguracion((prev) => ({ ...prev, tema: "oscuro" }))}
                      className="flex items-center"
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      Oscuro
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Idioma</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="idioma">Selecciona tu idioma</Label>
                      <select id="idioma" className="w-full rounded-md border border-gray-300 p-2" defaultValue="es">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Zona Horaria</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zonaHoraria">Selecciona tu zona horaria</Label>
                      <select
                        id="zonaHoraria"
                        className="w-full rounded-md border border-gray-300 p-2"
                        defaultValue="America/Lima"
                      >
                        <option value="America/Lima">América/Lima (GMT-5)</option>
                        <option value="America/Bogota">América/Bogotá (GMT-5)</option>
                        <option value="America/Mexico_City">América/Ciudad de México (GMT-6)</option>
                        <option value="America/Santiago">América/Santiago (GMT-4)</option>
                        <option value="Europe/Madrid">Europa/Madrid (GMT+1)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={guardarConfiguracion} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Notificaciones por Email</h3>
                    <p className="text-sm text-gray-500">Recibe notificaciones en tu correo electrónico</p>
                  </div>
                  <Switch
                    checked={configuracion.notificaciones.email}
                    onCheckedChange={(checked) => handleChangeConfiguracion("notificaciones", "email", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Notificaciones del Sistema</h3>
                    <p className="text-sm text-gray-500">Recibe notificaciones dentro de la plataforma</p>
                  </div>
                  <Switch
                    checked={configuracion.notificaciones.sistema}
                    onCheckedChange={(checked) => handleChangeConfiguracion("notificaciones", "sistema", checked)}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Tipos de Notificaciones</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">Nuevos Eventos</h3>
                        <p className="text-sm text-gray-500">Notificaciones sobre nuevos eventos en el calendario</p>
                      </div>
                      <Switch
                        checked={configuracion.notificaciones.nuevosEventos}
                        onCheckedChange={(checked) =>
                          handleChangeConfiguracion("notificaciones", "nuevosEventos", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">Nuevos Mensajes</h3>
                        <p className="text-sm text-gray-500">Notificaciones sobre nuevos mensajes recibidos</p>
                      </div>
                      <Switch
                        checked={configuracion.notificaciones.nuevasMensajes}
                        onCheckedChange={(checked) =>
                          handleChangeConfiguracion("notificaciones", "nuevasMensajes", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium">Nuevas Calificaciones</h3>
                        <p className="text-sm text-gray-500">Notificaciones sobre nuevas calificaciones registradas</p>
                      </div>
                      <Switch
                        checked={configuracion.notificaciones.nuevasCalificaciones}
                        onCheckedChange={(checked) =>
                          handleChangeConfiguracion("notificaciones", "nuevasCalificaciones", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={guardarConfiguracion} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacidad" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Privacidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Perfil Público</h3>
                    <p className="text-sm text-gray-500">Permite que otros usuarios vean tu perfil</p>
                  </div>
                  <Switch
                    checked={configuracion.privacidad.perfilPublico}
                    onCheckedChange={(checked) => handleChangeConfiguracion("privacidad", "perfilPublico", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Mostrar Email</h3>
                    <p className="text-sm text-gray-500">Permite que otros usuarios vean tu correo electrónico</p>
                  </div>
                  <Switch
                    checked={configuracion.privacidad.mostrarEmail}
                    onCheckedChange={(checked) => handleChangeConfiguracion("privacidad", "mostrarEmail", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Mostrar Última Conexión</h3>
                    <p className="text-sm text-gray-500">
                      Permite que otros usuarios vean cuándo fue tu última conexión
                    </p>
                  </div>
                  <Switch
                    checked={configuracion.privacidad.mostrarUltimaConexion}
                    onCheckedChange={(checked) =>
                      handleChangeConfiguracion("privacidad", "mostrarUltimaConexion", checked)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={guardarConfiguracion} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
