import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/header"
import Footer from "@/components/footer"
import "./globals.css"
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ["latin"] })

// Importar los providers de forma dinámica
const ThemeProvider = dynamic(() => import("@/components/theme-provider").then(mod => mod.ThemeProvider), {
  ssr: true
})

const AuthProvider = dynamic(() => import("@/lib/auth-context").then(mod => mod.AuthProvider), {
  ssr: true
})

export const metadata = {
  title: "Colegio Maria de los Angeles",
  description: "Formando líderes del mañana",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem 
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
