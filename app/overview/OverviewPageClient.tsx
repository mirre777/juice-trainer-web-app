"use client"

import type React from "react"
import { ClientWorkoutView } from "@/components/client-workout-view"
import { OverviewPageLayout } from "@/components/layout/overview-page-layout"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { fetchClients } from "@/lib/firebase/client-service"
import { ClientRequests } from "@/components/dashboard-alt/client-requests"
import Image from "next/image"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"

// We'll fetch real data in production, but have fallbacks
const defaultRevenue = {
  thisMonth: "€0",
  activeClients: 0,
}

const OverviewPageClient: React.FC = () => {
  const [clientWorkout, setClientWorkout] = useState<any>(null)
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [revenue, setRevenue] = useState(defaultRevenue)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trainerId, setTrainerId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get trainer ID from cookie (same approach as other pages)
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(";").shift()
          return null
        }

        const currentTrainerId = getCookie("user_id")
        setTrainerId(currentTrainerId)

        if (currentTrainerId) {
          try {
            // Fetch clients directly from Firebase
            const clients = await fetchClients(currentTrainerId)
            const totalClients = clients.length
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

        // Set static fallback data for other sections
        setCheckIns([])
        setSessions([])
      } catch (error) {
        console.error("Error fetching overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const parseWorkoutDate = (workout: any) => {
    try {
      // Try to get the date from startedAt first, then createdAt
      const dateValue = workout.startedAt || workout.createdAt

      if (!dateValue) {
        console.warn(`[Overview] Oops, no date found for workout: ${workout.name || "Unknown"}`)
        return null
      }

      // Handle Firestore timestamp
      if (typeof dateValue === "object" && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000)
      }

      // Handle string date
      const parsedDate = new Date(dateValue)
      if (isNaN(parsedDate.getTime())) {
        console.warn(`[Overview] Oops, invalid date found for workout: ${workout.name || "Unknown"} - ${dateValue}`)
        return null
      }

      return parsedDate
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

      const { getUserWorkouts } = await import("@/lib/firebase/workout-service")
      const { workouts, error } = await getUserWorkouts(userId)

      if (error || workouts.length === 0) {
        console.log(`[Overview] No workouts found for user ${userId}`)
        return []
      }

      const { start, end } = getCurrentWeekRange(referenceDate)
      console.log(`[Overview] Week range: ${start.toISOString()} to ${end.toISOString()}`)

      const weeklyWorkouts = workouts.filter((workout) => {
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
      console.log(`[Overview] Found ${clients.length} clients`)

      const validClients = clients.filter((client) => client.userId)
      console.log(`[Overview] Found ${validClients.length} clients with userId out of ${clients.length} total clients`)

      if (validClients.length === 0) {
        console.log("[Overview] No clients with userId found - returning null")
        return null
      }

      let latestWorkout = null
      let latestWorkoutDate = null
      let clientInfo = null
      let weeklyWorkouts = []

      // Check each client for their latest workout
      for (const client of validClients) {
        try {
          // Import the workout service function
          const { getUserWorkouts } = await import("@/lib/firebase/workout-service")
          const { workouts, error } = await getUserWorkouts(client.userId)

          if (error || workouts.length === 0) {
            console.log(`[Overview] No workouts found for client ${client.name}`)
            continue
          }

          // Find the most recent workout for this client
          let clientLatestWorkout = null
          let clientLatestDate = null

          for (const workout of workouts) {
            const workoutDate = parseWorkoutDate(workout)

            if (!workoutDate) {
              console.log(`[Overview] Skipping workout ${workout.name} - no valid date`)
              continue
            }

            if (!clientLatestDate || workoutDate > clientLatestDate) {
              clientLatestWorkout = workout
              clientLatestDate = workoutDate
            }
          }

          // If no workout had a valid date, skip this client
          if (!clientLatestWorkout || !clientLatestDate) {
            console.log(`[Overview] No workouts with valid dates found for client ${client.name}`)
            continue
          }

          // Check if this is the latest workout overall
          if (!latestWorkoutDate || clientLatestDate > latestWorkoutDate) {
            console.log(
              `[Overview] New latest workout found: ${clientLatestWorkout.name} (${clientLatestDate.toISOString()})`,
            )
            latestWorkout = clientLatestWorkout
            latestWorkoutDate = clientLatestDate
            clientInfo = {
              id: client.id,
              name: client.name,
              initials: client.initials,
              bgColor: client.bgColor,
              textColor: client.textColor,
              userId: client.userId, // Add this line
            }

            // NEW: Fetch weekly workouts for this client
            weeklyWorkouts = await fetchWeeklyWorkoutsForClient(client.userId, clientLatestDate)
          }

          console.log(
            `[Overview] Found workout for ${client.name}: ${clientLatestWorkout.name} (${clientLatestDate.toISOString()})`,
          )
        } catch (clientError) {
          console.error(`[Overview] Error fetching workouts for client ${client.name}:`, clientError)
        }
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

                {/* Check-ins - Entire widget wrapped */}
                <ComingSoonOverlay>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[200px]">
                    <h2 className="text-xl font-semibold mb-4">Check-ins</h2>
                    <div className="space-y-4">
                      {checkIns.length > 0 ? (
                        <div className="space-y-4">
                          {checkIns.map((checkIn) => (
                            <div key={checkIn.id} className="p-3 border border-gray-100 rounded-lg">
                              <div className="flex justify-between">
                                <span className="font-medium">{checkIn.client}</span>
                                <span className="text-sm text-gray-500">{checkIn.date}</span>
                              </div>
                              <p className="mt-1 text-gray-700">{checkIn.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-gray-500 mb-4">No check-ins yet. Client check-ins will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ComingSoonOverlay>
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

                {/* Upcoming Sessions - Entire widget wrapped */}
                <ComingSoonOverlay message="Sessions Coming Soon">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[250px]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                      <Link href="/calendar" className="text-zinc-700 text-sm underline">
                        View All Sessions
                      </Link>
                    </div>

                    <div>
                      {sessions.length > 0 ? (
                        <div className="space-y-3">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{session.client}</p>
                                <p className="text-sm text-gray-500">{session.time}</p>
                              </div>
                              <span className="px-2 py-1 bg-lime-100 text-lime-800 rounded text-xs">
                                {session.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-gray-500 mb-4">
                            No upcoming sessions. Schedule sessions from the Calendar page.
                          </p>
                          <Link href="/calendar">
                            <button className="inline-flex items-center justify-center px-4 py-2 bg-[#CCFF00] text-black font-medium rounded-md hover:bg-[#b8e600] transition-colors">
                              Sync Calendar
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </ComingSoonOverlay>

                {/* New Client Requests */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">New Client Requests</h2>
                    <Link href="/clients" className="text-zinc-700 text-sm underline">
                      Go to Clients
                    </Link>
                  </div>

                  <ClientRequests trainerId={trainerId} hideTitle={true} />
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
