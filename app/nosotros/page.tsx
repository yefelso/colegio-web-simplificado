"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Users, Award, Globe, Heart, BookOpen, GraduationCap } from "lucide-react"
import { HeroSection } from "@/components/ui/hero-section"

export default function NosotrosPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Nosotros" 
        description="Conoce nuestra historia y trayectoria educativa"
      />

      {/* Valores */}
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

      {/* Historia con imagen a la izquierda y fondo inclinado */}
      <section className="relative py-24 bg-gradient-to-br from-orange-500/90 to-yellow-500/90 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Imagen a la izquierda */}
            <div className="p-4 flex justify-center items-center">
  <img
    src="/images/nosotros/historia.png"
    alt="Historia del colegio"
    className="max-h-[500px] w-auto object-contain rounded-2xl shadow-lg"
  />
</div>

            {/* Texto a la derecha */}
            <div className="text-white p-6 md:p-12">
              <h2 className="text-4xl font-bold mb-6">Nuestra Historia</h2>
              <div className="prose prose-lg text-white">
                <p>
                La Institución Educativa María de los Ángeles inició sus labores académicas el 27 de abril de 1988 con Resolución Directoral 
                Departamental N° 00726 bajo la dirección de la Sra. Milka Cabrera de Ponce, la Prof. Yudy Ponce Cabrera como primera docente 
                y en la Promotoría el Sr. Eduardo Ponce Chávez; para atender el 1° grado de educación primaria. En 1994 se amplió los servicios
                educativos en el nivel inicial y después de 18 años de fructífera labor se decidió la ampliación con el funcionamiento del nivel 
                secundario
                </p>
                <p>
                La institución Educativa Privada María de los Ángeles es una institución que garantiza una educación de calidad en valores morales 
                y espirituales formando educandos plenamente creativos y responsables en la comunidad local, regional y nacional.
                </p>
                <p>
                Así mismo destacamos en los diversos concursos de conocimientos ocupando los primeros puestos en los niveles Inicial, Primaria y 
                Secundaria.

                En la actualidad ofrecemos un servicio educativo de calidad acorde a las nuevas exigencias y el desarrollo de la tecnología, 
                por lo que contamos con una moderno sistema académico integral de enseñanza virtual.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fondo inclinado inferior */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg
            className="w-full h-24 text-white"
            viewBox="0 0 1440 320"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,224L1440,0L1440,320L0,320Z" />
          </svg>
        </div>
      </section>
    </div>
  )
}
