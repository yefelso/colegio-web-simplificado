import { HeroSection } from "@/components/ui/hero-section"

export default function MatriculaPage() {
  const niveles = [
    {
      nombre: "Inicial",
      precio: "S/. 450",
      descripcion: "Educación inicial para niños de 3 a 5 años",
      icono: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      beneficios: [
        "Aulas especialmente diseñadas",
        "Docentes especializados",
        "Programa de estimulación temprana",
        "Áreas de juego seguras"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      nombre: "Primaria",
      precio: "S/. 550",
      descripcion: "Educación primaria completa",
      icono: (
        <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      beneficios: [
        "Programa bilingüe",
        "Talleres extracurriculares",
        "Laboratorio de computación",
        "Biblioteca moderna"
      ],
      color: "from-purple-500 to-purple-600"
    },
    {
      nombre: "Secundaria",
      precio: "S/. 650",
      descripcion: "Educación secundaria completa",
      icono: (
        <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      beneficios: [
        "Preparación preuniversitaria",
        "Laboratorios equipados",
        "Orientación vocacional",
        "Actividades deportivas"
      ],
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Matrícula 2024" 
        description="Asegura el futuro de tus hijos con una educación de calidad"
      />

      {/* Sección de Niveles Educativos con fondo inclinado */}
      <section className="relative py-24 overflow-hidden">
        {/* Fondo inclinado ajustado al tamaño del hero */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="absolute inset-0 transform -skew-y-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 origin-top-left"></div>
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Niveles Educativos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {niveles.map((nivel) => (
              <div key={nivel.nombre} className="relative group">
                {/* Decorative dots */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-bl-full"></div>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-3 bg-gradient-to-br rounded-xl shadow-lg">
                      {nivel.icono}
                    </div>
                    <div className="text-right">
                      <h3 className="text-2xl font-bold text-gray-900">{nivel.nombre}</h3>
                      <div className={`text-lg font-semibold bg-gradient-to-r ${nivel.color} bg-clip-text text-transparent`}>
                        {nivel.precio}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{nivel.descripcion}</p>

                  {/* Benefits */}
                  <ul className="space-y-3 mb-8">
                    {nivel.beneficios.map((beneficio) => (
                      <li key={beneficio} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {beneficio}
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button className={`w-full py-3 px-4 bg-gradient-to-r ${nivel.color} text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300`}>
                    Solicitar Información
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Talleres de Verano con nuevo fondo inclinado */}
      <section className="relative py-24 overflow-hidden">
        {/* Fondo inclinado */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="absolute inset-0 transform skew-y-3 bg-gradient-to-r from-orange-600/90 to-rose-600/90 origin-top-right"></div>
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] mix-blend-overlay opacity-20"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Talleres de Verano 2024</h2>
            <p className="text-xl text-white/90">Enero - Febrero | Vacaciones Divertidas y Educativas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                nombre: "Taller Inicial",
                precio: "S/. 200",
                icono: "🎨",
                actividades: ["Natación", "Arte y Creatividad", "Juegos Didácticos", "Estimulación Temprana"],
                color: "from-pink-500 to-rose-500"
              },
              {
                nombre: "Taller Primaria",
                precio: "S/. 250",
                icono: "⚽",
                actividades: ["Deportes", "Música", "Danza", "Manualidades"],
                color: "from-orange-500 to-amber-500"
              },
              {
                nombre: "Taller Secundaria",
                precio: "S/. 300",
                icono: "🤖",
                actividades: ["Robótica", "Programación", "Deportes", "Arte Digital"],
                color: "from-teal-500 to-emerald-500"
              }
            ].map((taller) => (
              <div key={taller.nombre} className="relative group">
                {/* Efecto de brillo */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/50 to-white/30 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-white rounded-xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-bl-full"></div>
                  
                  <div className="text-4xl mb-4">{taller.icono}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{taller.nombre}</h3>
                  <div className={`text-lg font-semibold bg-gradient-to-r ${taller.color} bg-clip-text text-transparent mb-6`}>
                    {taller.precio}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {taller.actividades.map((actividad) => (
                      <li key={actividad} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {actividad}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 px-4 bg-gradient-to-r ${taller.color} text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300`}>
                    Reservar Cupo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 