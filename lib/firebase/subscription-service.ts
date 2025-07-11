import { db } from "./firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
  maxClients: number
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  trainer_basic: {
    id: "trainer_basic",
    name: "Basic",
    price: 0,
    features: [
      "Up to 3 clients",
      "Basic workout tracking",
      "Client progress monitoring",
      "Email support",
      "Mobile app access",
    ],
    maxClients: 3,
  },
  trainer_pro: {
    id: "trainer_pro",
    name: "Pro",
    price: 49,
    features: [
      "Unlimited clients",
      "Advanced workout builder",
      "Google Sheets integration",
      "Progress analytics",
      "Custom branding",
      "Email & chat support",
    ],
    maxClients: -1, // Unlimited
  },
  trainer_elite: {
    id: "trainer_elite",
    name: "Elite",
    price: 99,
    features: [
      "Everything in Pro",
      "Priority support",
      "Vacation mode",
      "Advanced analytics",
      "API access",
      "White-label solution",
      "Dedicated account manager",
    ],
    maxClients: -1, // Unlimited
  },
}

export async function getUserSubscriptionPlan(userId: string): Promise<string> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.subscriptionPlan || "trainer_basic"
    }
    return "trainer_basic"
  } catch (error) {
    console.error("Error fetching user subscription plan:", error)
    return "trainer_basic"
  }
}

export async function updateUserSubscriptionPlan(userId: string, planId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      subscriptionPlan: planId,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating user subscription plan:", error)
    throw error
  }
}

export async function createUserSubscription(userId: string, planId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    await setDoc(
      userRef,
      {
        subscriptionPlan: planId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error("Error creating user subscription:", error)
    throw error
  }
}

export function getSubscriptionPlanDetails(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId] || null
}

export function canAddMoreClients(planId: string, currentClientCount: number): boolean {
  const plan = getSubscriptionPlanDetails(planId)
  if (!plan) return false

  if (plan.maxClients === -1) return true // Unlimited
  return currentClientCount < plan.maxClients
}
