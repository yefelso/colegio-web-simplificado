"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Users, Award, Globe, Heart, BookOpen, GraduationCap } from "lucide-react"

export default function NosotrosPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500 to-blue-400 text-white">
        <div className="container mx-auto px-4 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Sobre Nosotros</h1>
            <p className="text-xl mb-8">Conoce nuestra historia, valores y compromiso con la excelencia educativa</p>
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

      {/* Values Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <Heart className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Excelencia</h3>
              <p className="text-gray-600">Buscamos la excelencia en todo lo que hacemos</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Respeto</h3>
              <p className="text-gray-600">Fomentamos el respeto mutuo y la diversidad</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <Globe className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Innovación</h3>
              <p className="text-gray-600">Promovemos la innovación y el pensamiento creativo</p>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Nuestra Historia</h2>
            <p className="text-lg mb-8">
              Fundado en 1990, nuestro colegio ha sido un referente en la educación de calidad. A lo largo de los años,
              hemos formado generaciones de estudiantes que han contribuido significativamente a la sociedad.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">+30 Años</h3>
                <p className="text-sm">De experiencia educativa</p>
              </div>
              <div className="text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">+1000</h3>
                <p className="text-sm">Estudiantes graduados</p>
              </div>
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">+50</h3>
                <p className="text-sm">Premios y reconocimientos</p>
              </div>
            </div>
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
