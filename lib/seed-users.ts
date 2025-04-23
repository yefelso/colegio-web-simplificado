"\"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Usuarios de ejemplo
const sampleUsers = [
  {
    email: "admin@colegio.com",
    password: "admin123",
    nombre: "Admin",
    apellidos: "Principal",
    dni: "12345678A",
    role: "admin",
  },
  {
    email: "profesor@colegio.com",
    password: "profesor123",
    nombre: "Juan",
    apellidos: "Pérez",
    dni: "87654321B",
    role: "profesor",
  },
  {
    email: "alumno@colegio.com",
    password: "alumno123",
    nombre: "María",
    apellidos: "García",
    dni: "11223344C",
    role: "alumno",
  },
]

export function SeedUsers() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSeedUsers = async () => {
    setLoading(true)
    let successCount = 0

    try {
      for (const user of sampleUsers) {
        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password)

          // Add user data to Firestore
          await setDoc(doc(db, "users", userCredential.user.uid), {
            email: user.email,
            nombre: user.nombre,
            apellidos: user.apellidos,
            dni: user.dni,
            role: user.role,
          })

          successCount++
        } catch (error: any) {
          console.error(`Error creating user ${user.email}:`, error)
          // Continue with next user if one fails
        }
      }

      toast({
        title: "Usuarios creados",
        description: `Se han creado ${successCount} de ${sampleUsers.length} usuarios de ejemplo.`,
      })
    } catch (error) {
      console.error("Error seeding users:", error)
      toast({
        title: "Error",
        description: "No se pudieron crear los usuarios de ejemplo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSeedUsers} disabled={loading}>
      {loading ? "Creando usuarios..." : "Crear usuarios de ejemplo"}
    </Button>
  )
}
