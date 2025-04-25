"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { GraduationCap, Award, School } from "lucide-react"
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
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Misión Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg overflow-hidden h-[400px] flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                <div className="absolute inset-0">
                  <img
                    src="/images/informacion/mision.png"
                    alt="Misión"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 p-6 md:p-8 text-white flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4">Misión</h3>
                <p className="mb-4">
                  Formar integralmente a nuestros estudiantes con excelencia académica, 
                  valores sólidos y habilidades para la vida, preparándolos para ser 
                  líderes comprometidos con el desarrollo de su comunidad y el país.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span> Excelencia académica
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span> Formación en valores
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span> Desarrollo integral
                  </li>
                </ul>
              </div>
            </div>

            {/* Visión Card */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg overflow-hidden h-[400px] flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                <div className="absolute inset-0">
                  <img
                    src="/images/informacion/vision.png"
                    alt="Visión"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 p-6 md:p-8 text-white flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4">Visión</h3>
                <p className="mb-4">
                Ser una institución educativa líder en la región, reconocida por su carácter innovador, desarrollando el logro de las competencias, 
                análisis critico y creativo en los educandos, para que contribuyan en el desarrollo sostenido de la región y del país.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span> Liderazgo educativo
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span> Innovación constante
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-3"></span> Proyección internacional
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
            Somos una institución educativa, que garantiza una educación integral de calidad en conocimientos y valores, formando educandos creativos, 
            innovadores y emprendedores; comprometidos con el cuidado del medio ambiente y capaces de responder a las exigencias de un entorno 
            competitivo y globalizado.
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
