"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, X } from "lucide-react"

import PricingCard from "@/components/payment/pricing-card"
import { Testimonial } from "@/components/testimonial"

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  // Calculate annual price with 20% discount
  const monthlyPrice = 49
  const annualPrice = Math.round(monthlyPrice * 12 * 0.8)
  const annualMonthly = Math.round(annualPrice / 12)

  const testimonials = [
    {
      quote:
        "Juice has transformed how I manage my fitness business. The client tracking and workout builder save me hours every week.",
      author: "Sarah Johnson",
      role: "Personal Trainer",
      company: "FitLife Studio",
    },
    {
      quote:
        "The analytics and reporting features have helped me understand my business better and make data-driven decisions.",
      author: "Mark Williams",
      role: "Fitness Coach",
      company: "Elite Performance",
    },
    {
      quote: "My clients love the mobile app experience. It's made communication and workout tracking so much easier.",
      author: "Emma Davis",
      role: "Nutrition Coach",
    },
  ]

  return (
    <div className="container max-w-6xl py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Close button in upper right corner */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 right-4 p-2 text-black hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 z-50"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-4 text-md text-darkgray max-w-2xl mx-auto">
          Everything you need to <span className="bg-[#D2FF28] text-black px-1 rounded">manage your clients</span>,{" "}
          <span className="bg-[#D2FF28] text-black px-1 rounded">import workout programs from Google Sheets</span> and
          send them with your clients, and <span className="bg-[#D2FF28] text-black px-1 rounded">grow</span> your
          coaching business.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 flex items-center justify-center">
          <span className={`text-sm ${!isAnnual ? "text-black font-medium" : "text-darkgray"}`}>Monthly</span>
          <button
            className="relative inline-flex h-6 w-11 mx-3 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none"
            role="switch"
            aria-checked={isAnnual}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#D2FF28] shadow ring-0 transition duration-200 ease-in-out ${
                isAnnual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm ${isAnnual ? "text-black font-medium" : "text-darkgray"}`}>
            Annual <span className="bg-[#D2FF28] text-xs font-medium px-2 py-0.5 rounded-full ml-1">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <PricingCard
          name="Elite"
          price={isAnnual ? `${annualMonthly}` : 49}
          currency="€"
          description={
            isAnnual
              ? `€${annualPrice} billed annually (€${annualMonthly}/month)`
              : "Premium features for established trainers with growing businesses"
          }
          features={[
            "Everything in Pro",
            "White-label mobile app",
            "Advanced business analytics",
            "Client payment processing",
          ]}
          planId={isAnnual ? "price_elite_annual" : "price_elite"}
          comingSoon={true}
          buttonText="Get Elite"
        />
      </div>

      {/* Testimonials section */}
      <div className="mt-20">
        <h2 className="text-xl font-bold text-center mb-8">What our customers say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              company={testimonial.company}
            />
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <h3 className="text-xl font-medium mb-2">Need a custom solution?</h3>
        <p className="text-sm text-darkgray mb-6">
          Contact us for a tailored plan that meets your specific requirements.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-md text-black bg-[#D2FF28] hover:bg-opacity-90"
        >
          Contact Sales
        </Link>
      </div>
    </div>
  )
}
