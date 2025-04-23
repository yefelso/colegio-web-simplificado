"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Send } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function EnviarAlertas() {
  const { toast } = useToast()
  const [destinatarios, setDestinatarios] = useState("todos")
  const [asunto, setAsunto] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [enviandoTardanzas, setEnviandoTardanzas] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviarAlerta = async () => {
    if (!asunto.trim() || !mensaje.trim()) {
      setError("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Obtener los usuarios según el filtro seleccionado
      const usersRef = collection(db, "users")
      let usersQuery = query(usersRef)

      if (destinatarios !== "todos") {
        usersQuery = query(usersRef, where("role", "==", destinatarios))
      }

      const usersSnapshot = await getDocs(usersQuery)

      if (usersSnapshot.empty) {
        setError("No se encontraron destinatarios para enviar la alerta")
        setLoading(false)
        return
      }

      // Crear la alerta en la base de datos
      const alertaData = {
        asunto,
        mensaje,
        fecha: Timestamp.now(),
        destinatarios: destinatarios === "todos" ? "todos" : destinatarios,
        leido: false,
      }

      // Enviar la alerta a cada usuario
      const promesas = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data()

        await addDoc(collection(db, "alertas"), {
          ...alertaData,
          userId: userData.uid,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          role: userData.role,
        })
      })

      await Promise.all(promesas)

      toast({
        title: "Alerta enviada",
        description: `Se ha enviado la alerta a ${usersSnapshot.size} usuarios.`,
      })

      // Limpiar el formulario
      setAsunto("")
      setMensaje("")
    } catch (error) {
      console.error("Error al enviar alerta:", error)
      setError("Ocurrió un error al enviar la alerta. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const enviarAlertaTardanzas = async () => {
    setEnviandoTardanzas(true)
    setError(null)

    try {
      // Obtener las asistencias de hoy con tardanzas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startOfDay = Timestamp.fromDate(today)

      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)
      const endOfDayTimestamp = Timestamp.fromDate(endOfDay)

      const asistenciasRef = collection(db, "asistencias")
      const asistenciasQuery = query(
        asistenciasRef,
        where("fecha", ">=", startOfDay),
        where("fecha", "<=", endOfDayTimestamp),
      )

      const asistenciasSnapshot = await getDocs(asistenciasQuery)

      // Filtrar tardanzas
      const tardanzas: any[] = []
      asistenciasSnapshot.forEach((doc) => {
        const data = doc.data()
        const fecha = data.fecha.toDate()
        const hora = fecha.getHours()
        const minutos = fecha.getMinutes()

        if (hora > 8 || (hora === 8 && minutos > 0)) {
          tardanzas.push({
            id: doc.id,
            ...data,
            horaLlegada: `${hora}:${minutos.toString().padStart(2, "0")}`,
          })
        }
      })

      if (tardanzas.length === 0) {
        toast({
          title: "Sin tardanzas",
          description: "No hay tardanzas registradas para hoy.",
        })
        setEnviandoTardanzas(false)
        return
      }

      // Crear alertas para cada usuario con tardanza
      for (const tardanza of tardanzas) {
        await addDoc(collection(db, "alertas"), {
          asunto: "Notificación de tardanza",
          mensaje: `Se ha registrado tu llegada tardía a las ${tardanza.horaLlegada}. Recuerda que el horario de entrada es a las 8:00 AM.`,
          fecha: Timestamp.now(),
          userId: tardanza.userId,
          nombre: tardanza.nombre,
          apellidos: tardanza.apellidos,
          role: tardanza.role,
          leido: false,
          tipo: "tardanza",
        })
      }

      toast({
        title: "Alertas de tardanza enviadas",
        description: `Se han enviado ${tardanzas.length} notificaciones de tardanza.`,
      })
    } catch (error) {
      console.error("Error al enviar alertas de tardanza:", error)
      setError("Ocurrió un error al enviar las alertas de tardanza.")
    } finally {
      setEnviandoTardanzas(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enviar Alertas</h1>
        <p className="text-gray-500">Envía notificaciones y alertas a los usuarios del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alerta Personalizada</CardTitle>
            <CardDescription>Envía un mensaje personalizado a los usuarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <RadioGroup defaultValue="todos" value={destinatarios} onValueChange={setDestinatarios}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="todos" id="todos" />
                  <Label htmlFor="todos">Todos los usuarios</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alumno" id="alumnos" />
                  <Label htmlFor="alumnos">Solo alumnos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profesor" id="profesores" />
                  <Label htmlFor="profesores">Solo profesores</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                placeholder="Ingresa el asunto de la alerta"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea
                id="mensaje"
                placeholder="Escribe el mensaje que deseas enviar..."
                rows={5}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={enviarAlerta} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Alerta
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Predefinidas</CardTitle>
            <CardDescription>Envía alertas automáticas según criterios específicos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox id="tardanzas" />
                <div>
                  <Label htmlFor="tardanzas" className="font-medium">
                    Alerta de tardanzas
                  </Label>
                  <p className="text-sm text-gray-500">
                    Envía una notificación automática a todos los usuarios que llegaron tarde hoy.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={enviarAlertaTardanzas}
                disabled={enviandoTardanzas}
              >
                {enviandoTardanzas ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Enviando...
                  </>
                ) : (
                  "Enviar alertas de tardanza"
                )}
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox id="recordatorio" disabled />
                <div>
                  <Label htmlFor="recordatorio" className="font-medium">
                    Recordatorio de reunión
                  </Label>
                  <p className="text-sm text-gray-500">Envía un recordatorio sobre la próxima reunión de profesores.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" disabled>
                Enviar recordatorio
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox id="eventos" disabled />
                <div>
                  <Label htmlFor="eventos" className="font-medium">
                    Eventos escolares
                  </Label>
                  <p className="text-sm text-gray-500">
                    Notifica sobre próximos eventos escolares a toda la comunidad.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" disabled>
                Enviar notificación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
