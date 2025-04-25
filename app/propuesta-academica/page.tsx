"use client"

import { HeroSection } from "@/components/ui/hero-section"

export default function PropuestaAcademicaPage() {
  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Propuesta Académica" 
        description="Educación innovadora para el futuro"
      />

      {/* Sección de propuesta educativa */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Nuestra Propuesta Educativa
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Ofrecemos una educación integral que combina la excelencia académica
              con el desarrollo de habilidades para la vida. Nuestro programa
              educativo está diseñado para preparar a los estudiantes para los
              desafíos del futuro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Metodología Innovadora
              </h3>
              <p className="text-gray-600">
                Utilizamos métodos de enseñanza modernos que fomentan el
                pensamiento crítico y la creatividad.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Desarrollo Integral
              </h3>
              <p className="text-gray-600">
                Promovemos el desarrollo de habilidades sociales, emocionales
                y académicas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de contenedores de imágenes con fondo ajustado */}
      <section className="py-24 relative bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Explora Nuestra Propuesta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Imagen 1 */}
            <div className="flex items-center justify-center">
              <div className="w-full h-auto max-w-sm rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-3">
                <img
                  src="/images/propuestas/propuesta1.png"
                  alt="Propuesta 1"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
            {/* Imagen 2 */}
            <div className="flex items-center justify-center">
              <div className="w-full h-auto max-w-sm rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-3">
                <img
                  src="/images/propuestas/propuesta2.png"
                  alt="Propuesta 2"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
            {/* Imagen 3 */}
            <div className="flex items-center justify-center">
              <div className="w-full h-auto max-w-sm rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-3">
                <img
                  src="/images/propuestas/propuesta3.png"
                  alt="Propuesta 3"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
            {/* Imagen 4 */}
            <div className="flex items-center justify-center">
              <div className="w-full h-auto max-w-sm rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-3">
                <img
                  src="/images/propuestas/propuesta4.png"
                  alt="Propuesta 4"
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
