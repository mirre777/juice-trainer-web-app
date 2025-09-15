import Image from "next/image";

interface CelebrationProps {
  searchParams: Promise<{ trainerName: string }>
}

export default async function Page({ searchParams }: CelebrationProps) {
  // trainerName as a request param
  const { trainerName} = await searchParams;
  const features = [
    "Your workout data is now securely shared",
    "Your trainer will receive your workouts",
    "They can respond to your training sessions",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Juice Logo */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/images/logo.svg" alt="Juice Logo" width={66} height={100} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Connection Completed!</h2>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Your Trainer Section */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="relative">
            {/* Kettlebell Icon with Sparkles */}
            <Image src={"/images/kettlebell.svg"} alt="kettlebell" width={47} height={47} />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium">Your Trainer</p>
            <p className="text-lg font-bold text-white">{trainerName}</p>
          </div>
        </div>

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
                <Image src="/images/phone.svg" alt="Phone" width={24} height={24} />
              </div>
              <p className="font-semibold">
                Open or download the Juice app to log your workouts
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
                alt="Download on the App Store"
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
                alt="Download on the Google Play"
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
