"use client"

import { usePathname } from "next/navigation"
import { AuthForm, SourceType } from "@/components/auth/auth-form"
import { useEffect, useState } from "react"
import { getSharedWorkout } from "@/lib/firebase/shared-workout-service"
import type { FirebaseWorkout } from "@/lib/firebase/workout-service"

export default function LoginPage() {
  const pathname = usePathname()

  // Show workout view on mobile only if URL starts with "/share/"
  const showWorkoutOnMobile = pathname.startsWith("/share/")


  const [sharedWorkout, setSharedWorkout] = useState<FirebaseWorkout | null>(null)

  useEffect(() => {
    // Check for shared workout in URL path
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length === 2 && pathSegments[0] !== "login") {
      // URL format: /userId/workoutId
      const [userId, workoutId] = pathSegments

      getSharedWorkout(userId, workoutId).then(({ workout, error }) => {
        if (workout && !error) {
          setSharedWorkout(workout)
        }
      })
    }
  }, [pathname])

  const handleEmojiSelect = (emoji: string) => {
    console.log(`Selected emoji: ${emoji}`)
  }

  const handleComment = (comment: string) => {
    console.log(`Added comment: ${comment}`)
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      {/* Right side - Login Form (Full width on mobile unless /share/ in URL) */}
      <div
        className={`w-full ${showWorkoutOnMobile ? "lg:w-1/2" : "lg:w-1/2"} bg-white flex items-center justify-center lg:order-2 ${showWorkoutOnMobile ? "h-1/2 lg:h-full" : "h-full lg:h-full"}`}
      >
        <div className="w-full max-w-md px-6">
          <AuthForm mode="login" source={SourceType.TRAINER_AUTH} successUrl="/overview"/>
        </div>
      </div>

      {/* Left side - Demo Workout (Hidden on mobile unless /share/ in URL) */}
      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-0 bg-white lg:order-1 overflow-y-auto ${showWorkoutOnMobile ? "h-1/2 lg:h-full" : "hidden lg:flex lg:h-full"}`}
      >
        <div className="w-full h-full flex items-center justify-center">
          <img src="/images/value-proposition.png" alt="Juice Value Proposition" className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  )
}
