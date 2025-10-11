"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { PricingCard } from "@/components/payment/pricing-card"
import { getUserSubscriptionPlan } from "@/lib/firebase/subscription-service"

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<{ userId: string; email: string } | null>(null)

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        // Get user ID from auth token or session
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const { uid: userId, email } = await response.json()
          if (userId) {
            setUserData({ userId, email })
            const plan = await getUserSubscriptionPlan(userId)
            setCurrentPlan(plan)
          }
        }
      } catch (error) {
        console.error("Error fetching user plan:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  return (
    <div className="min-h-screen bg-white relative">
      {/* Close button in upper right corner */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 right-4 p-2 text-black hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200 z-50 bg-white shadow-sm border border-gray-200"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to <span className="bg-[#D2FF28] text-black px-1 rounded">manage your clients</span>,{" "}
            <span className="bg-[#D2FF28] text-black px-1 rounded">import workout programs from Google Sheets</span> and
            send them with your clients, and <span className="bg-[#D2FF28] text-black px-1 rounded">grow</span> your
            coaching business.
          </p>
        </div>

        {/* Pricing Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-[#D2FF28] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading your current plan...</span>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <PricingCard
              name="Basic"
              price="0"
              description="Perfect for getting started"
              features={[
                "Up to 3 clients",
                "Basic workout tracking",
                "Client progress monitoring",
                "Email support",
                "Mobile app access",
              ]}
              buttonText={currentPlan === "trainer_basic" ? "Current Plan" : "Start"}
              isCurrentPlan={currentPlan === "trainer_basic"}
              planId="trainer_basic"
              userId={userData?.userId}
              email={userData?.email}
            />

            {/* Pro Plan */}
            <div className="relative">
              <PricingCard
                name="Pro"
                price="29"
                description="For growing coaching businesses"
                features={[
                  "Unlimited clients",
                  "Advanced workout builder",
                  "Google Sheets integration",
                  "Progress analytics",
                  "Custom branding",
                  "Email & chat support",
                ]}
                buttonText="Pay us for Pro"
                isCurrentPlan={currentPlan === "trainer_pro"}
                planId="trainer_pro"
                userId={userData?.userId}
                email={userData?.email}
              />
            </div>

            {/* Elite Plan */}
            <div className="relative">
              <PricingCard
                name="Elite"
                price="45"
                description="For established coaching businesses"
                features={[
                  "Everything in Pro",
                  "Priority support",
                  "Vacation mode",
                  "Advanced analytics",
                  "API access",
                  "White-label solution",
                  "Dedicated account manager",
                ]}
                buttonText="Pay us for Elite"
                isCurrentPlan={currentPlan === "trainer_elite"}
                planId="trainer_elite"
                userId={userData?.userId}
                email={userData?.email}
              />
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            Need a custom solution?{" "}
            <button
              onClick={() => {
                const message = "Hi! I'm interested in a custom solution for my coaching business."
                const whatsappUrl = `https://wa.me/436602101427?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, "_blank")
              }}
              className="text-green-600 hover:underline cursor-pointer"
            >
              Contact us
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
