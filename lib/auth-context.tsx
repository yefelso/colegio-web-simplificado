"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "firebase/auth"

interface AuthContextType {
  user: UserData | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserData>
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
            const userData = {
              ...userDoc.data(),
              uid: firebaseUser.uid,
              email: firebaseUser.email,
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

  const handleSignIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      
      if (userDoc.exists()) {
        const firestoreData = userDoc.data()
        
        if (firestoreData.role) {
          const userData = {
            ...firestoreData,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
          } as UserData

          setUser(userData)
          return userData
        }
        
        throw new Error("Rol de usuario no válido")
      }
      
      throw new Error("No se encontró el documento del usuario")
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
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
