"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { GraduationCap, BookOpen, Users, Calendar, School, Award, Globe } from "lucide-react"

export default function InformacionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500 to-blue-400 text-white">
        <div className="container mx-auto px-4 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Información del Colegio</h1>
            <p className="text-xl mb-8">Conoce más sobre nuestra institución y nuestros programas educativos</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
        <svg
            className="w-full h-16 fill-white"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path d="M0,0 L1440,0 L1440,100 L0,100 L0,0 L1440,100 L1440,0 Z" />
          </svg>
        </div>
      </section>

      {/* Programs Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros Programas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <School className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Educación Primaria</h3>
              <p className="text-gray-600">Formación básica con enfoque en habilidades fundamentales y valores</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Educación Secundaria</h3>
              <p className="text-gray-600">Preparación académica avanzada con orientación vocacional</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <Award className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Programas Especiales</h3>
              <p className="text-gray-600">Actividades extracurriculares y programas de desarrollo personal</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Nuestra Misión</h2>
            <p className="text-lg mb-8">
              Formar estudiantes con excelencia académica, valores sólidos y habilidades para el éxito en un mundo globalizado.
              Nuestro compromiso es proporcionar una educación integral que prepare a nuestros estudiantes para los desafíos
              del futuro.
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
