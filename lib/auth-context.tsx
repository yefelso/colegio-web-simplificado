"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

interface User {
  uid: string
  email: string
  nombre: string
  apellidos: string
  role: "admin" | "profesor" | "alumno" | "auxiliar"
  dni?: string
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data() as User
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              ...userData,
            })
          } else {
            console.error("No se encontró el documento del usuario")
            await firebaseSignOut(auth)
            setUser(null)
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data() as User

        // Verificar que el rol sea válido (incluir "auxiliar" como rol válido)
        if (
          userData.role === "admin" ||
          userData.role === "profesor" ||
          userData.role === "alumno" ||
          userData.role === "auxiliar"
        ) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            ...userData,
          })
        } else {
          console.error("Rol de usuario no válido:", userData.role)
          await firebaseSignOut(auth)
          throw new Error("Rol de usuario no válido")
        }
      } else {
        console.error("No se encontró el documento del usuario")
        await firebaseSignOut(auth)
        throw new Error("No se encontró el documento del usuario")
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
