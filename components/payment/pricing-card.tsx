import { Check } from "lucide-react"
import { useEffect, useState } from "react"

interface PricingCardProps {
  name: string
  price: number | string
  currency?: string
  description: string
  features: string[]
  planId: string
  comingSoon?: boolean
  buttonText?: string
  isCurrentPlan?: boolean
}

function PricingCard({
  name,
  price,
  currency = "€",
  description,
  features,
  planId,
  comingSoon = false,
  buttonText = "Get Elite",
  isCurrentPlan = false,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
      const fetchUser = async () => {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        console.log("User data:", response)
        const { uid: userId, email } = await response.json()
        console.log("User:", userId, email)
        if (userId) {
          setUserId(userId)
          setEmail(email)
        }
      } else {
        console.error("Failed to fetch user data:", response)
      }
    }
    fetchUser();
  }, []);

  const handleSubscribe = async () => {
    if (isCurrentPlan) {
      // Do nothing if this is the current plan
      return
    }
    setIsLoading(true);
    if (!userId) {
      console.error("User ID not found")
      setIsLoading(false);
      return
    }

    if (planId === "trainer_pro") {
      window.location.href = `https://buy.stripe.com/cNicN63CJ2u248L4cUfMA02?client_reference_id=${userId}&locked_prefilled_email=${email}`
    } else if (planId === "trainer_elite") {
      window.location.href = `https://buy.stripe.com/eVqfZi1uB4CafRt24MfMA03?client_reference_id=${userId}&locked_prefilled_email=${email}`
    }
    setIsLoading(false);
  }

  return (
    <div
      className={`rounded-lg border ${isCurrentPlan ? "border-[#D2FF28]" : "border-gray-200"} bg-white p-6 shadow-sm flex flex-col h-full`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-black">{name}</h3>
        {isCurrentPlan && (
          <span className="bg-[#D2FF28] text-black text-xs font-medium px-3 py-1 rounded-full">CURRENT PLAN</span>
        )}
        {comingSoon && (
          <span className="bg-gray-200 text-black text-xs font-medium px-3 py-1 rounded-full">COMING SOON</span>
        )}
      </div>

      <div className="flex items-baseline mb-4">
        {price === "Free" ? (
          <span className="text-4xl font-bold text-black">Free</span>
        ) : (
          <>
            <span className="text-4xl font-bold text-black">
              {currency}
              {price}
            </span>
            <span className="ml-1 text-sm text-darkgray">/month</span>
          </>
        )}
      </div>

      <p className="text-sm text-darkgray mb-8">{description}</p>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-black">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isLoading || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors text-sm mt-auto ${
          isCurrentPlan
            ? "text-black bg-gray-100 cursor-default"
            : "text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  )
}

export { PricingCard }
export default PricingCard
