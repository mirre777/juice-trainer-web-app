import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function MobileAppSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">You're Now Connected to Your Coach 💪</CardTitle>
          <CardDescription className="text-gray-600">
            Your trainer can now see your workouts and send you personalized programs.
            <br />
            <br />
            Let's get to work.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <img
              src="/images/juice-mobile-app.jpeg"
              alt="Juice Mobile App"
              className="mx-auto w-32 h-32 object-cover rounded-lg mb-4"
            />
          </div>

          <Button asChild className="w-full bg-lime-500 hover:bg-lime-600">
            <Link href="https://juice.fitness/download-juice-app" target="_blank">
              Download Juice App
            </Link>
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>Available on iOS and Android</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
