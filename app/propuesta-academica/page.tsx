"use client"

import { HeroSection } from "@/components/ui/hero-section"

export default function PropuestaAcademicaPage() {
  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Propuesta Académica" 
        description="Educación innovadora para el futuro"
      />

      {/* Primera sección con fondo inclinado */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="absolute inset-0 transform -skew-y-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 origin-top-left"></div>
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Metodología Educativa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                titulo: "Aprendizaje Activo",
                descripcion: "Metodología basada en proyectos y experiencias prácticas",
                icono: (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                color: "from-blue-500 to-blue-600"
              },
              {
                titulo: "Educación Bilingüe",
                descripcion: "Programa integral en español e inglés con certificaciones internacionales",
                icono: (
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                ),
                color: "from-purple-500 to-purple-600"
              },
              {
                titulo: "Tecnología Educativa",
                descripcion: "Integración de herramientas digitales y recursos tecnológicos",
                icono: (
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((item) => (
              <div key={item.titulo} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/50 to-white/30 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                  <div className="p-3 bg-gradient-to-br rounded-xl shadow-lg inline-block mb-6">
                    {item.icono}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.titulo}</h3>
                  <p className="text-gray-600">{item.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segunda sección - Áreas de Desarrollo */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 transform skew-y-3 bg-gradient-to-r from-yellow-500 to-orange-500 origin-top-right"></div>
          <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Áreas de Desarrollo</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                titulo: "Académica",
                icono: "📚",
                descripcion: "Excelencia en todas las materias"
              },
              {
                titulo: "Artística",
                icono: "🎨",
                descripcion: "Desarrollo de la creatividad"
              },
              {
                titulo: "Deportiva",
                icono: "⚽",
                descripcion: "Formación física integral"
              },
              {
                titulo: "Personal",
                icono: "🌟",
                descripcion: "Desarrollo socioemocional"
              }
            ].map((area) => (
              <div key={area.titulo} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/50 to-white/30 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-white rounded-xl shadow-xl p-6 text-center transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-4xl mb-4">{area.icono}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{area.titulo}</h3>
                  <p className="text-gray-600">{area.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Logros Académicos con fondo rojo */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 transform -skew-y-3 bg-gradient-to-r from-red-600 to-red-500 origin-top-left"></div>
          <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Logros Académicos</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { numero: "100%", texto: "Ingresantes a Universidades", icono: "🎓" },
              { numero: "50+", texto: "Premios Académicos", icono: "🏆" },
              { numero: "95%", texto: "Nivel de Inglés Avanzado", icono: "🌎" },
              { numero: "100%", texto: "Satisfacción de Padres", icono: "⭐" }
            ].map((logro) => (
              <div key={logro.texto} className="bg-white rounded-xl shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">{logro.icono}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{logro.numero}</div>
                <div className="text-gray-600">{logro.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
