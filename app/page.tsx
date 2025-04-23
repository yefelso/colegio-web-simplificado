"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { GraduationCap, BookOpen, Users, Calendar } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500 to-blue-400 text-white">
        <div className="container mx-auto px-4 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Bienvenido a Nuestro Colegio</h1>
            <p className="text-xl mb-8">Un lugar donde la excelencia académica se encuentra con el desarrollo personal</p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push("/login")}
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 text-white"
            viewBox="0 0 1440 100"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,0 L1440,100 L1440,0 Z" />
          </svg>
        </div>
      </section>

      {/* Information Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Educación de Calidad</h3>
              <p className="text-gray-600">Programas académicos diseñados para el éxito</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Biblioteca Digital</h3>
              <p className="text-gray-600">Acceso a recursos educativos en línea</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Comunidad Activa</h3>
              <p className="text-gray-600">Participación de padres y estudiantes</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Eventos Culturales</h3>
              <p className="text-gray-600">Actividades extracurriculares variadas</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Sobre Nosotros</h2>
            <p className="text-lg mb-8">
              Somos una institución educativa comprometida con la excelencia académica y el desarrollo integral de nuestros
              estudiantes. Nuestro objetivo es formar líderes del mañana con valores sólidos y habilidades para el éxito.
            </p>
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50"
              onClick={() => router.push("/contacto")}
            >
              Contáctanos
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 text-white"
            viewBox="0 0 1440 100"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,100 L1440,0 L1440,100 Z" />
          </svg>
        </div>
      </section>
    </div>
  )
}
