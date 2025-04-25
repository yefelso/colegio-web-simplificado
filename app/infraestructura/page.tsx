import { HeroSection } from "@/components/ui/hero-section"

export default function InfraestructuraPage() {
  const instalaciones = [
    {
      nombre: "Aulas Modernas",
      imagen: "/images/infraestructura/aulas.png",
      descripcion: "Espacios equipados con tecnología de última generación",
      caracteristicas: [
        "Proyectores interactivos",
        "Mobiliario ergonómico",
        "Iluminación natural",
        "Sistema de ventilación"
      ]
    },
    {
      nombre: "Patio de inicial",
      imagen: "/images/infraestructura/patio.png",
      descripcion: "Espacios para el desarrollo físico y deportivo",
      caracteristicas: [
        "Equipos modernos",
        "Materiales de calidad",
        "Seguridad certificada",
        "Capacidad para 30 alumnos"
      ]
    },
    {
      nombre: "Áreas Deportivas",
      imagen: "/images/infraestructura/deportes.png",
      descripcion: "Espacios para el desarrollo físico y deportivo",
      caracteristicas: [
        "Cancha multideportiva",
        "Piscina temperada",
        "Gimnasio equipado",
        "Vestuarios modernos"
      ]
    }
    // Puedes agregar más instalaciones aquí
  ]

  return (
    <div className="min-h-screen">
      <HeroSection 
        title="Infraestructura" 
        description="Instalaciones modernas para una educación de calidad"
      />

      <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {instalaciones.map((instalacion) => (
              <div key={instalacion.nombre} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="relative h-64">
                  <img
                    src={instalacion.imagen}
                    alt={instalacion.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <h3 className="text-2xl font-bold text-white p-6">{instalacion.nombre}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{instalacion.descripcion}</p>
                  <ul className="space-y-2">
                    {instalacion.caracteristicas.map((caracteristica) => (
                      <li key={caracteristica} className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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
    </div>
  )
} 