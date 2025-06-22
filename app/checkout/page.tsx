"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import CheckoutForm from "@/components/payment/checkout-form"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Get plan details from URL parameters
  const planId = searchParams.get("plan") || ""
  const planName = searchParams.get("name") || ""
  const price = Number(searchParams.get("price") || 0)
  const userId = searchParams.get("userId") || ""

  useEffect(() => {
    // Validate required parameters
    if (!planId || !planName || !price || !userId) {
      router.push("/pricing")
      return
    }

    setIsLoading(false)
  }, [planId, planName, price, userId, router])

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-12 px-4 sm:px-6 lg:px-8">
      <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-8">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to pricing
      </button>

      <div className="max-w-md mx-auto">
        <CheckoutForm planId={planId} planName={planName} amount={price} userId={userId} />
      </div>
    </div>
  )
}
