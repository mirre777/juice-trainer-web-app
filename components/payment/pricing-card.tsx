"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface PricingCardProps {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant?: "default" | "outline" | "secondary"
  isPopular?: boolean
  isCurrent?: boolean
  planId: string
  disabled?: boolean
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  isPopular = false,
  isCurrent = false,
  planId,
  disabled = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (disabled || isCurrent) return

    setLoading(true)
    try {
      if (planId === "trainer_basic") {
        // Basic plan is free, just update the user's plan
        const response = await fetch("/api/user/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionPlan: planId,
          }),
        })

        if (response.ok) {
          window.location.reload()
        } else {
          console.error("Failed to update plan")
        }
      } else {
        // For paid plans, redirect to checkout
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId,
            amount: Number.parseInt(price) * 100, // Convert to cents
          }),
        })

        if (response.ok) {
          const { url } = await response.json()
          window.location.href = url
        } else {
          console.error("Failed to create payment intent")
        }
      }
    } catch (error) {
      console.error("Error upgrading plan:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`relative ${isPopular ? "border-[#D2FF28] border-2" : ""}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-[#D2FF28] text-black hover:bg-[#D2FF28]/90">Most Popular</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <h3 className="text-2xl font-bold">{title}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-gray-600">/{period}</span>
        </div>
        <p className="text-gray-600">{description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          variant={buttonVariant}
          className={`w-full ${isPopular && !disabled ? "bg-[#D2FF28] text-black hover:bg-[#D2FF28]/90" : ""}`}
          disabled={disabled || loading || isCurrent}
        >
          {loading ? "Processing..." : buttonText}
        </Button>

        {isCurrent && <p className="text-center text-sm text-green-600 font-medium">✓ This is your current plan</p>}
      </CardContent>
    </Card>
  )
}
