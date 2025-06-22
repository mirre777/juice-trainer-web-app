"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import QRCode from "qrcode.react"

interface AppDownloadQRProps {
  inviteCode: string
}

export function AppDownloadQR({ inviteCode }: AppDownloadQRProps) {
  const [accepted, setAccepted] = useState(false)
  const router = useRouter()
  const [appStoreQRCode, setAppStoreQRCode] = useState("")
  const [playStoreQRCode, setPlayStoreQRCode] = useState("")

  useEffect(() => {
    // Generate QR codes for App Store and Play Store with the invite code
    const appStoreLink = `https://www.juice.fitness/client/${inviteCode}` // Replace with actual App Store link
    const playStoreLink = `https://www.juice.fitness/client/${inviteCode}` // Replace with actual Play Store link

    QRCode.toDataURL(appStoreLink)
      .then((url) => {
        setAppStoreQRCode(url)
      })
      .catch((err) => {
        console.error("Error generating App Store QR code:", err)
      })

    QRCode.toDataURL(playStoreLink)
      .then((url) => {
        setPlayStoreQRCode(url)
      })
      .catch((err) => {
        console.error("Error generating Play Store QR code:", err)
      })
  }, [inviteCode])

  const handleAccept = () => {
    setAccepted(true)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Invitation content */}
      <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
        {!accepted ? (
          <>
            <h1 className="text-4xl font-bold mb-4">You've been invited!</h1>
            <p className="text-lg mb-8">Your Coach has invited you to join Juice, a workout tracking platform.</p>

            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">By accepting this invitation, you'll be able to:</h2>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-lime-500 mr-2">•</span>
                  Track your workouts
                </li>
                <li className="flex items-center">
                  <span className="text-lime-500 mr-2">•</span>
                  Monitor your progress
                </li>
                <li className="flex items-center">
                  <span className="text-lime-500 mr-2">•</span>
                  Communicate with your trainer
                </li>
                <li className="flex items-center">
                  <span className="text-lime-500 mr-2">•</span>
                  Access your personalized training program
                </li>
              </ul>
            </div>

            <Button
              onClick={handleAccept}
              className="bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 px-6 rounded-md w-full md:w-auto"
            >
              Accept Invitation
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-4">Download the Juice App</h1>
            <p className="text-lg mb-8">Scan the QR code to download the app for your device.</p>

            <div className="flex flex-col md:flex-row justify-center gap-8 mb-10">
              <div className="flex flex-col items-center">
                <div className="bg-[#D2FF28] p-2 rounded-lg mb-2">
                  {/* App Store QR code */}
                  {appStoreQRCode ? (
                    <a
                      href={`https://www.juice.fitness/client/${inviteCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <QRCode
                        value={`https://www.juice.fitness/client/${inviteCode}`}
                        size={160}
                        bgColor="#fff"
                        fgColor="#000"
                        level="H"
                      />
                    </a>
                  ) : (
                    <div className="w-40 h-40 bg-gray-200 animate-pulse" />
                  )}
                </div>
                <p className="font-semibold">App Store</p>
                <p className="text-sm text-gray-500">For iPhone & iPad</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-[#D2FF28] p-2 rounded-lg mb-2">
                  {/* Play Store QR code */}
                  {playStoreQRCode ? (
                    <a
                      href={`https://www.juice.fitness/client/${inviteCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <QRCode
                        value={`https://www.juice.fitness/client/${inviteCode}`}
                        size={160}
                        bgColor="#fff"
                        fgColor="#000"
                        level="H"
                      />
                    </a>
                  ) : (
                    <div className="w-40 h-40 bg-gray-200 animate-pulse" />
                  )}
                </div>
                <p className="font-semibold">Google Play</p>
                <p className="text-sm text-gray-500">For Android devices</p>
              </div>
            </div>

            <Button variant="outline" className="mb-8" onClick={() => router.push("/login")}>
              Go to Website
            </Button>

            <p className="text-sm text-gray-500">
              Invitation code: <span className="font-mono">{inviteCode}</span>
            </p>
          </>
        )}
      </div>

      {/* Right side - App screenshots */}
      <div className="hidden md:flex flex-1 bg-black items-center justify-center p-8">
        <div className="relative w-full h-full max-w-lg max-h-lg">
          {/* App screenshots would go here */}
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-48 h-96 bg-gray-800 rounded-3xl border-4 border-gray-700 overflow-hidden">
            <div className="w-full h-12 bg-lime-400 flex items-center justify-center">
              <span className="font-bold text-black">Juice</span>
            </div>
            <div className="p-2">
              <div className="w-full h-8 bg-gray-700 rounded-md mb-2"></div>
              <div className="w-full h-24 bg-gray-700 rounded-md mb-2"></div>
              <div className="w-full h-24 bg-gray-700 rounded-md mb-2"></div>
              <div className="w-full h-24 bg-gray-700 rounded-md"></div>
            </div>
          </div>

          <div className="absolute top-2/3 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-48 h-96 bg-gray-800 rounded-3xl border-4 border-gray-700 overflow-hidden">
            <div className="w-full h-12 bg-lime-400 flex items-center justify-center">
              <span className="font-bold text-black">Juice</span>
            </div>
            <div className="p-2">
              <div className="w-full h-8 bg-gray-700 rounded-md mb-2"></div>
              <div className="w-full h-36 bg-gray-700 rounded-md mb-2"></div>
              <div className="w-full h-36 bg-gray-700 rounded-md"></div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-black rounded-md flex items-center justify-center">
            <div className="w-40 h-40 bg-lime-400 flex items-center justify-center">
              <span className="text-4xl font-bold text-black">JUICE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppDownloadQR
