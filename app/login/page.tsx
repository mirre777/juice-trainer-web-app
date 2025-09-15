"use client"

import { usePathname } from "next/navigation"
import { AuthForm, SourceType } from "@/components/auth/auth-form"
import { ClientWorkoutView } from "@/components/client-workout-view"
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
        <div className="w-full h-full overflow-y-auto">
          <ClientWorkoutView
            client={{
              id: "client-1",
              name: "Michael Thompson",
              image: "/images/happy-apple.png",
              date: "April 25, 2025",
              programWeek: "3",
              programTotal: "8",
              daysCompleted: "3",
              daysTotal: "4",
            }}
            workout={
              sharedWorkout
                ? {
                    day: sharedWorkout.day,
                    focus: sharedWorkout.focus,
                    clientNote: sharedWorkout.clientNote,
                  }
                : {
                    day: "2",
                    focus: "Lower Body",
                    clientNote:
                      "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
                  }
            }
            exercises={
              sharedWorkout
                ? sharedWorkout.exercises
                : [
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
            personalRecords={[
              {
                exercise: "Bench Press",
                weight: "85 kg",
                reps: "5 reps",
                date: "April 18, 2025",
                isPR: true,
              },
              {
                exercise: "Deadlift",
                weight: "180 kg",
                reps: "3 reps",
                date: "April 11, 2025",
              },
            ]}
            onEmojiSelect={handleEmojiSelect}
            onComment={handleComment}
            showInteractionButtons={false}
          />
        </div>
      </div>
    </div>
  )
}
