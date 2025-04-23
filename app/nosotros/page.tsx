import { Card, CardContent } from "@/components/ui/card"

export default function NosotrosPage() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:py-20">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Sobre Nosotros</h1>
          <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Conoce nuestra historia, misión, visión y el equipo que hace posible nuestra labor educativa.
          </p>
        </div>
      </div>

      {/* Historia */}
      <section className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">Nuestra Historia</h2>
          <p className="text-gray-500 mb-4">
            El Colegio Maria de los Angeles fue fundado en 1985 con la visión de ofrecer una educación de calidad que combine la
            excelencia académica con la formación en valores. A lo largo de más de tres décadas, hemos crecido y
            evolucionado, adaptándonos a los cambios educativos y tecnológicos, pero manteniendo siempre nuestra esencia
            y compromiso con la formación integral de nuestros estudiantes.
          </p>
          <p className="text-gray-500">
            Desde nuestros humildes inicios con apenas 50 estudiantes, hoy nos enorgullece ser una institución
            reconocida que ha formado a miles de profesionales que contribuyen positivamente a la sociedad en diversos
            campos.
          </p>
        </div>
        <div className="relative h-[400px] rounded-xl overflow-hidden">
          <img
            src="/placeholder.svg?height=400&width=600&text=Historia"
            alt="Historia del Colegio"
            className="object-cover w-full h-full"
          />
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="rounded-full bg-blue-100 p-4 w-16 h-16 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-blue-600"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Nuestra Misión</h2>
            <p className="text-gray-500">
              Formar estudiantes íntegros con sólidos conocimientos académicos, valores éticos y habilidades para la
              vida, capaces de enfrentar los desafíos del mundo actual y contribuir positivamente a la sociedad.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="rounded-full bg-blue-100 p-4 w-16 h-16 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-blue-600"
              >
                <path d="M2 12h5" />
                <path d="M17 12h5" />
                <path d="M12 2v5" />
                <path d="M12 17v5" />
                <path d="m4.93 4.93 3.54 3.54" />
                <path d="m15.54 15.54 3.54 3.54" />
                <path d="m4.93 19.07 3.54-3.54" />
                <path d="m15.54 8.46 3.54-3.54" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Nuestra Visión</h2>
            <p className="text-gray-500">
              Ser reconocidos como una institución educativa de referencia, que forma líderes comprometidos con el
              desarrollo sostenible, la innovación y la transformación positiva de su entorno.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Valores */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Nuestros Valores</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Excelencia",
              description: "Buscamos la mejora continua en todos los aspectos de nuestra labor educativa.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ),
            },
            {
              title: "Respeto",
              description: "Valoramos la dignidad de cada persona y promovemos relaciones basadas en la empatía.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6 6 6 0 0 0 6 6h0" />
                  <path d="M6 8a6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6H6Z" />
                </svg>
              ),
            },
            {
              title: "Responsabilidad",
              description: "Fomentamos el compromiso con las propias acciones y sus consecuencias.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                  <path d="M12 8v4l3 3" />
                </svg>
              ),
            },
            {
              title: "Innovación",
              description: "Promovemos la creatividad y la búsqueda de soluciones originales a los desafíos.",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M9.663 17h4.673M12 12v-1M8.5 8.5a2.5 2.5 0 0 1 5 0c0 2.5-5 2.5-5 5M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" />
                </svg>
              ),
            },
          ].map((value, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="rounded-full bg-blue-100 p-4 mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold">{value.title}</h3>
                <p className="text-gray-500 mt-2">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Equipo Directivo */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Equipo Directivo</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "María Rodríguez",
              position: "Directora General",
              bio: "Licenciada en Educación con más de 20 años de experiencia en gestión educativa.",
            },
            {
              name: "Carlos Mendoza",
              position: "Director Académico",
              bio: "Doctor en Ciencias de la Educación, especialista en innovación pedagógica.",
            },
            {
              name: "Ana Gómez",
              position: "Coordinadora de Primaria",
              bio: "Máster en Psicopedagogía, experta en educación infantil y primaria.",
            },
            {
              name: "Roberto Sánchez",
              position: "Coordinador de Secundaria",
              bio: "Licenciado en Matemáticas con especialización en didáctica de las ciencias.",
            },
            {
              name: "Laura Torres",
              position: "Jefa de Orientación",
              bio: "Psicóloga educativa con amplia experiencia en atención a la diversidad.",
            },
            {
              name: "Javier López",
              position: "Administrador",
              bio: "MBA con especialización en gestión de instituciones educativas.",
            },
          ].map((member, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                  <img
                    src={`/placeholder.svg?height=100&width=100&text=${member.name.charAt(0)}`}
                    alt={member.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-blue-600 font-medium">{member.position}</p>
                <p className="text-gray-500 mt-2">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
