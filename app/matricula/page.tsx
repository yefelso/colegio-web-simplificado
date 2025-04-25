import { HeroSection } from "@/components/ui/hero-section"

export default function MatriculaPage() {
  const niveles = [
    {
      nombre: "Inicial",
      imagen: "/images/inicial.jpg",
      precio: "S/. 450",
      descripcion: "Educación inicial para niños de 3 a 5 años",
      beneficios: [
        "Aulas especialmente diseñadas",
        "Docentes especializados",
        "Programa de estimulación temprana",
        "Áreas de juego seguras"
      ]
    },
    {
      nombre: "Primaria",
      imagen: "/images/primaria.jpg",
      precio: "S/. 550",
      descripcion: "Educación primaria completa",
      beneficios: [
        "Programa bilingüe",
        "Talleres extracurriculares",
        "Laboratorio de computación",
        "Biblioteca moderna"
      ]
    },
    {
      nombre: "Secundaria",
      imagen: "/images/secundaria.jpg",
      precio: "S/. 650",
      descripcion: "Educación secundaria completa",
      beneficios: [
        "Preparación preuniversitaria",
        "Laboratorios equipados",
        "Orientación vocacional",
        "Actividades deportivas"
      ]
    }
  ]

  const talleres = [
    {
      nombre: "Taller de Verano - Inicial",
      imagen: "/images/taller-inicial.jpg",
      precio: "S/. 200",
      actividades: [
        "Natación",
        "Arte y Creatividad",
        "Juegos Didácticos",
        "Estimulación Temprana"
      ]
    },
    {
      nombre: "Taller de Verano - Primaria",
      imagen: "/images/taller-primaria.jpg",
      precio: "S/. 250",
      actividades: [
        "Deportes",
        "Música",
        "Danza",
        "Manualidades"
      ]
    },
    {
      nombre: "Taller de Verano - Secundaria",
      imagen: "/images/taller-secundaria.jpg",
      precio: "S/. 300",
      actividades: [
        "Robótica",
        "Programación",
        "Deportes",
        "Arte Digital"
      ]
    }
  ]

  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Matrícula 2024" 
        description="Asegura el futuro de tus hijos con una educación de calidad"
      />

      {/* Sección de Niveles Educativos */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Niveles Educativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {niveles.map((nivel) => (
              <div key={nivel.nombre} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <img
                    src={nivel.imagen}
                    alt={nivel.nombre}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full">
                    {nivel.precio}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{nivel.nombre}</h3>
                  <p className="text-gray-600 mb-4">{nivel.descripcion}</p>
                  <ul className="space-y-2">
                    {nivel.beneficios.map((beneficio) => (
                      <li key={beneficio} className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                  <button className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Solicitar Información
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Talleres de Verano */}
      <section className="py-24 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Talleres de Verano 2024</h2>
            <p className="text-xl text-gray-600">Enero - Febrero | Vacaciones Divertidas y Educativas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {talleres.map((taller) => (
              <div key={taller.nombre} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <img
                    src={taller.imagen}
                    alt={taller.nombre}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full">
                    {taller.precio}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{taller.nombre}</h3>
                  <ul className="space-y-2">
                    {taller.actividades.map((actividad) => (
                      <li key={actividad} className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {actividad}
                      </li>
                    ))}
                  </ul>
                  <button className="mt-6 w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors">
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