import Image from "next/image";


export default function Page() {
  const features = [
    "Tus entrenamientos te esperan en la app Juice",
    "Registra tu progreso cada vez que entrenes",
    "Mantente al tanto de tu viaje fitness"
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Juice Logo */}
      <div className="text-center mb-8">
        <Image src="/images/logo.svg" alt="Logo de Juice" width={66} height={100} />
        <h1 className="text-xl font-medium text-gray-900">juice</h1>
        <h2 className="text-2xl font-bold text-gray-900 my-3">¡Todo listo!</h2>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h3 className="text-left text-md font-bold text-gray-900">Tu programa gratuito de entrenamiento está listo</h3>

        <div className="flex flex-col items-center gap-6 py-6 bg-white">
          <div className="flex flex-col gap-4 text-[#474A48] text-lg w-full">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-lime-100">
                  <Image src="/images/check-square.svg" alt="Check" width={14} height={14} />
                </div>
                <p>{feature}</p>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-lime-100 w-8 h-8 flex items-center justify-center">
                <Image src="/images/phone.svg" alt="Teléfono" width={24} height={24} />
              </div>
              <p className="font-semibold">
                Abre o descarga la app Juice para comenzar tus entrenamientos
              </p>
            </div>
          </div>

          {/* Store buttons */}
          <div className="flex gap-4">
            <a
              href="https://apps.apple.com/us/app/juice-fitness-app/id6744974452"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/appstore-badge.svg"
                alt="Descargar en App Store"
                width={120}
                height={48}
                className="h-12 w-auto"
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=fitness.beta.juice&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/images/googleplay-badge.svg"
                alt="Descargar en Google Play"
                width={120}
                height={48}
                className="h-12 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
