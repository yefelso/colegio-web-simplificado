import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InformacionPage() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16 lg:py-20">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Información Académica</h1>
          <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Conoce nuestros programas educativos, metodología y servicios.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl mt-12">
        <Tabs defaultValue="programas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="programas">Programas</TabsTrigger>
            <TabsTrigger value="metodologia">Metodología</TabsTrigger>
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
          </TabsList>
          <TabsContent value="programas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Programas Educativos</CardTitle>
                <CardDescription>
                  Nuestros programas están diseñados para desarrollar el potencial de cada estudiante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Educación Primaria</h3>
                  <p className="mt-2 text-gray-500">
                    Nuestro programa de primaria se enfoca en desarrollar habilidades fundamentales en lectura,
                    escritura, matemáticas y ciencias, mientras fomentamos la curiosidad y el amor por el aprendizaje.
                  </p>
                  <ul className="mt-4 list-disc pl-6 text-gray-500">
                    <li>Grados: 1° a 6° de primaria</li>
                    <li>Horario: 8:00 AM - 2:00 PM</li>
                    <li>Idiomas: Español e Inglés</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Educación Secundaria</h3>
                  <p className="mt-2 text-gray-500">
                    El programa de secundaria prepara a los estudiantes para la educación superior con un currículo
                    riguroso y enfoque en el pensamiento crítico y habilidades de investigación.
                  </p>
                  <ul className="mt-4 list-disc pl-6 text-gray-500">
                    <li>Grados: 1° a 5° de secundaria</li>
                    <li>Horario: 8:00 AM - 3:00 PM</li>
                    <li>Programas especiales: Bachillerato Internacional</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="metodologia" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nuestra Metodología</CardTitle>
                <CardDescription>
                  Utilizamos métodos pedagógicos innovadores centrados en el estudiante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Aprendizaje Activo</h3>
                  <p className="mt-2 text-gray-500">
                    Promovemos la participación activa de los estudiantes en su proceso de aprendizaje, fomentando la
                    experimentación, el trabajo en equipo y la resolución de problemas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Educación Personalizada</h3>
                  <p className="mt-2 text-gray-500">
                    Reconocemos que cada estudiante tiene diferentes fortalezas, intereses y estilos de aprendizaje.
                    Nuestros docentes adaptan su enseñanza para satisfacer las necesidades individuales.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Tecnología Educativa</h3>
                  <p className="mt-2 text-gray-500">
                    Integramos herramientas tecnológicas en el aula para enriquecer la experiencia de aprendizaje y
                    preparar a los estudiantes para un mundo digital.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="servicios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Servicios Adicionales</CardTitle>
                <CardDescription>
                  Ofrecemos diversos servicios para apoyar el desarrollo integral de nuestros estudiantes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Orientación Psicopedagógica</h3>
                  <p className="mt-2 text-gray-500">
                    Contamos con un equipo de psicólogos y orientadores que brindan apoyo emocional y académico a los
                    estudiantes y sus familias.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Actividades Extracurriculares</h3>
                  <p className="mt-2 text-gray-500">
                    Ofrecemos una amplia variedad de actividades deportivas, artísticas y culturales para complementar
                    la formación académica.
                  </p>
                  <ul className="mt-4 list-disc pl-6 text-gray-500">
                    <li>Deportes: fútbol, baloncesto, voleibol, natación</li>
                    <li>Arte: música, teatro, danza, artes visuales</li>
                    <li>Clubes: robótica, debate, ciencias, matemáticas</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Comedor Escolar</h3>
                  <p className="mt-2 text-gray-500">
                    Servicio de alimentación con menús balanceados y nutritivos, supervisados por nutricionistas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
