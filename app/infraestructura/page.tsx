import { HeroSection } from "@/components/ui/hero-section"

export default function InfraestructuraPage() {
  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Infraestructura" 
        description="Instalaciones modernas para una educación de calidad"
      />

      {/* Primera sección - Instalaciones Principales */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="absolute inset-0 transform -skew-y-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 origin-top-left"></div>
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Instalaciones Principales</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                titulo: "Aulas Modernas",
                descripcion: "Espacios diseñados para el aprendizaje óptimo",
                caracteristicas: [
                  "Proyectores interactivos",
                  "Mobiliario ergonómico",
                  "Iluminación natural",
                  "Ventilación adecuada"
                ],
                icono: (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                color: "from-blue-500 to-blue-600"
              },
              {
                titulo: "Laboratorios",
                descripcion: "Equipamiento de última generación",
                caracteristicas: [
                  "Laboratorio de ciencias",
                  "Sala de computación",
                  "Laboratorio de idiomas",
                  "Equipos modernos"
                ],
                icono: (
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                ),
                color: "from-purple-500 to-purple-600"
              },
              {
                titulo: "Áreas Deportivas",
                descripcion: "Espacios para el desarrollo físico",
                caracteristicas: [
                  "Cancha multideportiva",
                  "Piscina temperada",
                  "Gimnasio equipado",
                  "Áreas recreativas"
                ],
                icono: (
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                ),
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((instalacion) => (
              <div key={instalacion.titulo} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/50 to-white/30 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                  <div className="p-3 bg-gradient-to-br rounded-xl shadow-lg inline-block mb-6">
                    {instalacion.icono}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{instalacion.titulo}</h3>
                  <p className="text-gray-600 mb-6">{instalacion.descripcion}</p>
                  <ul className="space-y-3">
                    {instalacion.caracteristicas.map((caracteristica) => (
                      <li key={caracteristica} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {caracteristica}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segunda sección - Espacios Complementarios */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 transform skew-y-3 bg-gradient-to-r from-yellow-500 to-orange-500 origin-top-right"></div>
          <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Espacios Complementarios</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { nombre: "Biblioteca", icono: "📚", descripcion: "Amplia colección de libros y recursos digitales" },
              { nombre: "Auditorio", icono: "🎭", descripcion: "Espacio para eventos y presentaciones" },
              { nombre: "Cafetería", icono: "🍽️", descripcion: "Alimentación saludable y balanceada" },
              { nombre: "Áreas Verdes", icono: "🌳", descripcion: "Espacios de recreación y descanso" }
            ].map((espacio) => (
              <div key={espacio.nombre} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/50 to-white/30 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-white rounded-xl shadow-xl p-6 text-center transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-4xl mb-4">{espacio.icono}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{espacio.nombre}</h3>
                  <p className="text-sm text-gray-600">{espacio.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 