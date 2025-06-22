"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Set a timeout to redirect to the overview page after 5 seconds
    const redirectTimeout = setTimeout(() => {
      router.push("/overview")
    }, 5000)

    return () => clearTimeout(redirectTimeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your payment. Your subscription has been activated successfully.
        </p>
        <p className="text-sm text-gray-500 mb-8">You will be redirected to your overview page in a few seconds...</p>
        <Button onClick={() => router.push("/overview")} className="w-full bg-[#D2FF28] text-black hover:bg-[#c2ef18]">
          Go to Overview Now
        </Button>
      </div>
    </div>
  )
}
