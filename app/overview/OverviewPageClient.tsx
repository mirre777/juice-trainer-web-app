"use client"

import type React from "react"
import { ClientWorkoutView } from "@/components/client-workout-view"
import { OverviewPageLayout } from "@/components/layout/overview-page-layout"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { fetchClients, getTotalClients } from "@/lib/firebase/client-service"
import { ClientRequests } from "@/components/dashboard-alt/client-requests"
import Image from "next/image"
import { FirebaseWorkout, getLatestWorkoutForUser, getUserWorkouts} from "@/lib/firebase/workout-service"
import { Timestamp } from "firebase/firestore"
import { ClientStatus } from "@/types/client"

// We'll fetch real data in production, but have fallbacks
const defaultRevenue = {
  thisMonth: "€0",
  activeClients: 0,
}

const OverviewPageClient: React.FC = () => {
  console.log("[Overview] Component rendering...")

  const [clientWorkout, setClientWorkout] = useState<any>(null)
  const [revenue, setRevenue] = useState(defaultRevenue)
  const [loading, setLoading] = useState(true)
  const [trainerId, setTrainerId] = useState<string | null>(null)

  // Add ref to prevent multiple data fetching
  const hasFetchedData = useRef(false)

  // Get trainer ID from cookie (same approach as other pages)
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()
    return null
  }

  useEffect(() => {
    console.log("[Overview] useEffect triggered, hasFetchedData:", hasFetchedData.current)

    // Prevent multiple data fetching
    if (hasFetchedData.current) {
      console.log("[Overview] Data already fetched, skipping...")
      return
    }

    const fetchData = async () => {
      try {
        console.log("[Overview] Starting data fetch...")
        setLoading(true)
        hasFetchedData.current = true

        const currentTrainerId = getCookie("user_id")
        console.log("[Overview] Trainer ID from cookie:", currentTrainerId)
        setTrainerId(currentTrainerId || null)

        if (currentTrainerId) {
          try {
            // Fetch clients directly from Firebase
            const totalClients = await getTotalClients(currentTrainerId)
            setRevenue((prev) => ({ ...prev, activeClients: totalClients }))

            // Fetch the latest workout across all clients
            const latestWorkoutData = await fetchLatestWorkoutAcrossClients(currentTrainerId)
            if (latestWorkoutData) {
              setClientWorkout(latestWorkoutData)
            }
          } catch (error) {
            console.error("Error fetching clients:", error)
          }
        }
      } catch (error) {
        console.error("Error fetching overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Cleanup function to reset the ref when component unmounts
    return () => {
      hasFetchedData.current = false
    }
  }, [hasFetchedData])

  const parseWorkoutDate = (workout: FirebaseWorkout): Date | null => {
    try {
      // Try to get the date from startedAt first, then createdAt
      const dateValue: any = workout.startedAt || workout.createdAt
      if (dateValue && dateValue instanceof Timestamp) {
        return dateValue.toDate();
      }
      return new Date(dateValue)
    } catch (error) {
      console.error(`[Overview] Oops, error parsing date for workout: ${workout.name || "Unknown"}`, error)
      return null
    }
  }

  // NEW: Function to get the start and end of the current week (Monday to Sunday)
  const getCurrentWeekRange = (referenceDate: Date) => {
    const date = new Date(referenceDate)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday

    const monday = new Date(date.setDate(diff))
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return { start: monday, end: sunday }
  }

  // NEW: Function to fetch weekly workouts for a specific client
  const fetchWeeklyWorkoutsForClient = async (userId: string, referenceDate: Date) => {
    try {
      console.log(`[Overview] Fetching weekly workouts for user: ${userId}`)


      const { workouts, error } = await getUserWorkouts(userId)

      if (error || workouts.length === 0) {
        console.log(`[Overview] No workouts found for user ${userId}`)
        return []
      }

      const { start, end } = getCurrentWeekRange(referenceDate)
      console.log(`[Overview] Week range: ${start.toISOString()} to ${end.toISOString()}`)

      const weeklyWorkouts = workouts.filter((workout: any) => {
        const workoutDate = parseWorkoutDate(workout)
        if (!workoutDate) return false

        return workoutDate >= start && workoutDate <= end
      })

      console.log(`[Overview] Found ${weeklyWorkouts.length} workouts for this week`)
      return weeklyWorkouts
    } catch (error) {
      console.error(`[Overview] Error fetching weekly workouts for user ${userId}:`, error)
      return []
    }
  }

  const fetchLatestWorkoutAcrossClients = async (trainerId: string) => {
    try {
      console.log(`[Overview] Fetching latest workout across all clients for trainer: ${trainerId}`)

      // First, get all clients
      const clients = await fetchClients(trainerId)
      console.log(`[Overview] Found ${clients.length} total clients`)

      const filteredClients = clients.filter((client) => client.userId && client.status === ClientStatus.Active)
      console.log(`[Overview] Found ${filteredClients.length} active clients`)

      if (filteredClients.length === 0) {
        console.log("[Overview] No active clients with userId found - returning null")
        return null
      }

      let latestWorkout = null
      let latestWorkoutDate = null
      let clientInfo = null
      let weeklyWorkouts: any[] = []

      const workoutsByClient = await Promise.all(filteredClients.map(async (client) => {
        const { workout, error } = await getLatestWorkoutForUser(trainerId, client)
        return { client, workout: !error ? workout : null }
      }))

      // Check each client for their latest workout
      for (const {client, workout} of workoutsByClient) {
        try {

          if (!workout) {
            console.log(`[Overview] No workouts found for client ${client.name}`)
            continue
          }

          const workoutDate = parseWorkoutDate(workout)

          // Check if this is the latest workout overall
          if (!latestWorkoutDate || (workoutDate && workoutDate > latestWorkoutDate)) {
            console.log(
              `[Overview] New latest workout found: ${workout.name} (${workoutDate?.toISOString()})`,
            )
            latestWorkout = workout
            latestWorkoutDate = workoutDate
            clientInfo = {
              id: client.id,
              name: client.name,
              initials: client.initials,
              userId: client.userId, // Add this line
            }

            // NEW: Fetch weekly workouts for this client
          }

          console.log(
            `[Overview] Found workout for ${client.name}: ${workout.name} (${workoutDate?.toISOString()})`,
          )
        } catch (clientError) {
          console.error(`[Overview] Error fetching workouts for client ${client.name}:`, clientError)
        }
      }

      if (latestWorkoutDate && clientInfo?.userId) {
        weeklyWorkouts = await fetchWeeklyWorkoutsForClient(clientInfo.userId, latestWorkoutDate)
      }

      if (!latestWorkout || !clientInfo || !latestWorkoutDate) {
        console.log("[Overview] No valid workouts found - all clients either have no userId or no workouts")
        return null
      }

      if (latestWorkout && clientInfo && latestWorkoutDate) {
        console.log(
          `[Overview] Latest workout found: ${latestWorkout.name} by ${clientInfo.name} (${latestWorkoutDate.toISOString()})`,
        )
        return {
          client: clientInfo,
          workout: latestWorkout,
          exercises: latestWorkout.exercises || [],
          personalRecords: latestWorkout.personalRecords || [],
          weeklyWorkouts: weeklyWorkouts,
          userId: clientInfo.userId, // Change from clientInfo.userId to client.userId
        }
      }

      console.log("[Overview] No workouts with valid dates found across all clients")
      return null
    } catch (error) {
      console.error("[Overview] Error fetching latest workout across clients:", error)
      return null
    }
  }

  return (
    <OverviewPageLayout>
      {/* Main Content */}
      <main className="py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CCFF00]"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Client Workout View */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  {clientWorkout ? (
                    <ClientWorkoutView
                      client={clientWorkout.client}
                      workout={clientWorkout.workout}
                      exercises={clientWorkout.exercises}
                      personalRecords={clientWorkout.personalRecords}
                      weeklyWorkouts={clientWorkout.weeklyWorkouts} // NEW: Pass weekly workouts
                      userId={clientWorkout.userId} // Pass the userId here
                      onEmojiSelect={() => {}}
                      onComment={() => {}}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-4">
                        <PlusCircle className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No recent workouts</h3>
                      <p className="text-gray-500 mb-4 max-w-md">
                        Your clients' recent workouts will appear here once they complete them.
                      </p>
                      <Link href="/clients">
                        <button className="inline-flex items-center justify-center px-4 py-2 bg-[#CCFF00] text-black font-medium rounded-md hover:bg-[#b8e600] transition-colors">
                          Add Client
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Quick Stats (formerly Revenue Overview) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-500 text-sm">Total Clients</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">{revenue.activeClients}</p>
                        {revenue.activeClients === 0 && (
                          <Image
                            src="/images/sleeping-mascot.png"
                            alt="No clients yet"
                            width={50}
                            height={50}
                            className="opacity-60"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Client Requests */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">New Client Requests</h2>
                    <Link href="/clients" className="text-zinc-700 text-sm underline">
                      Go to Clients
                    </Link>
                  </div>

                  <ClientRequests trainerId={trainerId || ""} hideTitle={true} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </OverviewPageLayout>
  )
}

export default OverviewPageClient
