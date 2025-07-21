"use client"

import { useState, useEffect } from "react"
import { PricingCard } from "@/components/payment/pricing-card"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"
import { getUserSubscriptionPlan } from "@/lib/firebase/subscription-service"

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        // Get user ID from auth token or session
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const { user } = await response.json()
          if (user?.id) {
            const plan = await getUserSubscriptionPlan(user.id)
            setCurrentPlan(plan)
          }
        }
      } catch (error) {
        console.error("Error fetching user plan:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  return (
    <div className="min-h-screen bg-white">
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
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Basic Plan */}
          <PricingCard
            title="Basic"
            price="0"
            period="month"
            description="Perfect for getting started"
            features={[
              "Up to 3 clients",
              "Basic workout tracking",
              "Client progress monitoring",
              "Email support",
              "Mobile app access",
            ]}
            buttonText={currentPlan === "trainer_basic" ? "Current Plan" : "Start"}
            buttonVariant={currentPlan === "trainer_basic" ? "outline" : "default"}
            isPopular={false}
            isCurrent={currentPlan === "trainer_basic"}
            planId="trainer_basic"
            disabled={currentPlan === "trainer_basic"}
          />

          {/* Pro Plan */}
          <div className="relative">
            <ComingSoonOverlay />
            <PricingCard
              title="Pro"
              price="49"
              period="month"
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
              buttonVariant="default"
              isPopular={true}
              isCurrent={currentPlan === "trainer_pro"}
              planId="trainer_pro"
              disabled={true}
            />
          </div>

          {/* Elite Plan */}
          <div className="relative">
            <ComingSoonOverlay />
            <PricingCard
              title="Elite"
              price="69"
              period="month"
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
              buttonVariant="default"
              isPopular={false}
              isCurrent={currentPlan === "trainer_elite"}
              planId="trainer_elite"
              disabled={true}
            />
          </div>
        </div>

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
