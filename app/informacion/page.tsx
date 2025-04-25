"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { GraduationCap, BookOpen, Users, Calendar, School, Award, Globe } from "lucide-react"
import { HeroSection } from "@/components/ui/hero-section"

export default function InformacionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Información" 
        description="Conoce más sobre nuestra institución"
      />

      {/* Visión y Misión Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Misión Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div className="relative h-64">
                <img
                  src="/images/mision.jpg"
                  alt="Misión"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 to-blue-600/50 flex items-center justify-center">
                  <h3 className="text-3xl font-bold text-white">Misión</h3>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 leading-relaxed">
                  Formar integralmente a nuestros estudiantes con excelencia académica, 
                  valores sólidos y habilidades para la vida, preparándolos para ser 
                  líderes comprometidos con el desarrollo de su comunidad y el país.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Excelencia académica
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Formación en valores
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Desarrollo integral
                  </li>
                </ul>
              </div>
            </div>

            {/* Visión Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div className="relative h-64">
                <img
                  src="/images/vision.jpg"
                  alt="Visión"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 to-blue-600/50 flex items-center justify-center">
                  <h3 className="text-3xl font-bold text-white">Visión</h3>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 leading-relaxed">
                  Ser reconocidos como una institución educativa líder en la formación 
                  de estudiantes con excelencia académica, valores éticos y compromiso 
                  social, preparados para enfrentar los desafíos del mundo globalizado.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Liderazgo educativo
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Innovación constante
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Proyección internacional
                  </li>
                </ul>
              </div>
            </div>
          </div>
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
