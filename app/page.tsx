"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { getCookie } from "cookies-next"
import { Button } from "@/components/ui/button"
import { ClientWorkoutView } from "@/components/client-workout-view"
import { getSharedWorkout } from "@/lib/firebase/shared-workout-service"
import type { FirebaseWorkout } from "@/lib/firebase/workout-service"

export default function LandingPage() {
  const router = useRouter()
  const pathname = usePathname()

  // Show workout view on mobile only if URL starts with "/share/"
  const showWorkoutOnMobile = pathname.startsWith("/share/")

  const [sharedWorkout, setSharedWorkout] = useState<FirebaseWorkout | null>(null)
  const [isLoadingSharedWorkout, setIsLoadingSharedWorkout] = useState(false)

  useEffect(() => {
    // Check for shared workout in URL path
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length === 2) {
      // URL format: /userId/workoutId
      const [userId, workoutId] = pathSegments
      setIsLoadingSharedWorkout(true)

      getSharedWorkout(userId, workoutId).then(({ workout, error }) => {
        if (workout && !error) {
          setSharedWorkout(workout)
        }
        setIsLoadingSharedWorkout(false)
      })
    } else {
      // Check for auth token on the client side as a fallback
      const authToken = getCookie("auth_token")
      if (authToken && authToken.toString().trim() !== "") {
        console.log("[LandingPage] Auth token found, redirecting to overview")
        router.push("/overview")
      }
    }
  }, [router, pathname])

  const handleEmojiSelect = (emoji: string) => {
    console.log(`Selected emoji: ${emoji}`)
  }

  const handleComment = (comment: string) => {
    console.log(`Added comment: ${comment}`)
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      {/* Right side - Welcome Content with Buttons (Top on mobile, full width when workout hidden) */}
      <div
        className={`w-full ${showWorkoutOnMobile ? "lg:w-1/2" : "lg:w-1/2"} bg-white flex items-center justify-center lg:order-2 ${showWorkoutOnMobile ? "h-1/2 lg:h-full" : "h-full lg:h-full"}`}
      >
        <div className="w-full max-w-md px-6">
          <div className="text-center space-y-4 lg:space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">Juice</h1>
              <p className="text-gray-500 mt-2">Track your clients' fitness journey</p>
              <p className="mt-3 lg:mt-4 text-gray-600 text-sm lg:text-base">
                The complete coaching platform for personal trainers. Manage clients, create programs, track progress,
                and grow your business.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:gap-4 mt-6 lg:mt-8">
              <Link href="/login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full py-2.5 lg:py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup" className="w-full">
                <Button className="w-full py-2.5 lg:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Left side - Demo Workout (Hidden on mobile unless /share/ in URL) */}
      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-0 bg-white lg:order-1 overflow-y-auto ${showWorkoutOnMobile ? "h-1/2 lg:h-full" : "hidden lg:flex lg:h-full"}`}
      >
        <div className="w-full h-full overflow-y-auto">
          <ClientWorkoutView
            client={{
              id: sharedWorkout?.id || "client-1",
              name: sharedWorkout?.clientName || "Michael Thompson",
              image: "/happy-apple.png",
              date: sharedWorkout?.date || "April 25, 2025",
              programWeek: "3",
              programTotal: "8",
              daysCompleted: "3",
              daysTotal: "4",
            }}
            workout={{
              day: "2",
              focus: sharedWorkout?.focus || "Lower Body",
              clientNote:
                sharedWorkout?.notes ||
                "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
            }}
            exercises={
              sharedWorkout?.exercises?.map((exercise, index) => ({
                id: exercise.id || `ex-${index}`,
                name: exercise.name,
                weight: exercise.sets?.[0]?.weight ? `${exercise.sets[0].weight} kg` : "0 kg",
                reps: exercise.sets?.[0]?.reps?.toString() || "0",
                completed: exercise.sets?.some((set) => set.weight > 0) || false,
                isPR: exercise.sets?.some((set) => set.isPR) || false,
                sets:
                  exercise.sets?.map((set, setIndex) => ({
                    number: setIndex + 1,
                    weight: `${set.weight} kg`,
                    reps: set.reps.toString(),
                    isPR: set.isPR || false,
                  })) || [],
              })) || [
                // Fallback to mock data
                {
                  id: "ex-1",
                  name: "Back Squat",
                  weight: "120 kg",
                  reps: "5",
                  completed: true,
                  sets: [
                    { number: 1, weight: "120 kg", reps: "5" },
                    { number: 2, weight: "120 kg", reps: "5" },
                    { number: 3, weight: "120 kg", reps: "5" },
                  ],
                },
                {
                  id: "ex-2",
                  name: "Romanian DL",
                  weight: "100 kg",
                  reps: "10",
                  completed: false,
                },
                {
                  id: "ex-3",
                  name: "Leg Press",
                  weight: "200 kg",
                  reps: "10",
                  completed: true,
                  isPR: true,
                  sets: [
                    { number: 1, weight: "200 kg", reps: "10", isPR: true },
                    { number: 2, weight: "200 kg", reps: "8" },
                    { number: 3, weight: "180 kg", reps: "12" },
                  ],
                },
                {
                  id: "ex-4",
                  name: "Leg Extension",
                  weight: "70 kg",
                  reps: "12",
                  completed: true,
                  sets: [
                    { number: 1, weight: "70 kg", reps: "12" },
                    { number: 2, weight: "70 kg", reps: "12" },
                    { number: 3, weight: "70 kg", reps: "12" },
                  ],
                },
              ]
            }
            personalRecords={sharedWorkout?.personalRecords || []}
            onEmojiSelect={handleEmojiSelect}
            onComment={handleComment}
            showInteractionButtons={false}
            isMockData={!sharedWorkout}
            allClientWorkouts={[]}
            weeklyWorkouts={[]}
          />
        </div>
      </div>

      {/* Play Around First button floating on top */}
      <Link
        href="/demo/overview"
        className="fixed bottom-4 lg:bottom-6 right-4 lg:right-6 z-10 flex flex-col items-end gap-1"
      >
        <div className="bg-black hover:bg-black/90 text-white rounded-full shadow-lg px-4 lg:px-5 py-2 lg:py-2.5 flex items-center gap-2">
          <span className="font-medium text-sm lg:text-base">Play Around First</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 lg:h-5 lg:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
        <span className="text-xs text-gray-500 mr-2">No sign up needed</span>
      </Link>
    </div>
  )
}
