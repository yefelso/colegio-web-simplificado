interface HeroSectionProps {
  title: string
  description?: string
  showButton?: boolean
  buttonText?: string
  buttonAction?: () => void
}

export function HeroSection({ 
  title, 
  description, 
  showButton = false, 
  buttonText = "", 
  buttonAction 
}: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-500 to-blue-400 text-white">
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">{title}</h1>
          {description && <p className="text-xl mb-8">{description}</p>}
          {showButton && buttonText && (
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={buttonAction}
            >
              {buttonText}
            </Button>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-16 fill-white"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,100 L0,100 L0,0 L1440,100 L1440,0 Z" />
        </svg>
      </div>
    </section>
  )
} 