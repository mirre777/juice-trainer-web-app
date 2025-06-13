"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getLatestWorkoutForUser } from "@/lib/firebase/workout-service"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ClientWorkout2Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default user ID for demo purposes
  const userId = "xnumhzQK4dRcAqNMHVlfEtnAPZl2"

  useEffect(() => {
    async function fetchLatestWorkout() {
      try {
        setLoading(true)
        const latestWorkout = await getLatestWorkoutForUser(userId)

        if (latestWorkout) {
          // Redirect to the specific workout page
          router.push(`/demo/client-workout2/users/${userId}/workouts/${latestWorkout.id}`)
        } else {
          setError("No workouts found for this user")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching latest workout:", err)
        setError("Failed to load workout data")
        setLoading(false)
      }
    }

    fetchLatestWorkout()
  }, [router, userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading workout...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </Card>
      </div>
    )
  }

  return null
}
