"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "firebase/auth"

interface AuthContextType {
  user: UserData | null
  loading: boolean
  signOut: () => Promise<void>
}

interface UserData {
  uid: string
  email: string | null
  role: string
  nombre?: string
  apellidos?: string
  [key: string]: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          
          if (userDoc.exists()) {
            // Crear el objeto de usuario combinando datos de Firebase Auth y Firestore
            const userData = {
              ...userDoc.data(),
              // No necesitamos especificar uid y email aquí ya que vienen en userDoc.data()
            } as UserData

            setUser(userData)
          } else {
            console.error("No se encontró el documento del usuario")
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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  const signIn = async (userData: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userData.uid))
      
      if (userDoc.exists()) {
        const firestoreData = userDoc.data()
        
        if (firestoreData.role) {
          // Crear el objeto de usuario combinando datos
          const combinedData = {
            ...firestoreData,
            // No necesitamos especificar uid y email aquí ya que vienen en firestoreData
          } as UserData

          setUser(combinedData)
          return combinedData
        }
        
        console.error("Rol de usuario no válido:", firestoreData.role)
        throw new Error("Rol de usuario no válido")
      }
      
      console.error("No se encontró el documento del usuario")
      throw new Error("No se encontró el documento del usuario")
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
