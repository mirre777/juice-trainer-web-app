"use client"

import type React from "react"
import { ClientWorkoutView } from "@/components/client-workout-view"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { fetchClients } from "@/lib/firebase/client-service"
import { ClientRequests } from "@/components/dashboard-alt/client-requests"
import Image from "next/image"

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

        // Get trainer ID from cookie
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
      } catch (err) {
        console.error("Error fetching overview data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const parseWorkoutDate = (workout: any) => {
    try {
      const dateValue = workout.startedAt || workout.createdAt

      if (!dateValue) {
        return null
      }

      // Handle Firestore timestamp
      if (typeof dateValue === "object" && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000)
      }

      // Handle string date
      const parsedDate = new Date(dateValue)
      if (isNaN(parsedDate.getTime())) {
        return null
      }

      return parsedDate
    } catch (error) {
      return null
    }
  }

  const fetchLatestWorkoutAcrossClients = async (trainerId: string) => {
    try {
      // First, get all clients
      const clients = await fetchClients(trainerId)

      const validClients = clients.filter((client) => client.userId)

      if (validClients.length === 0) {
        return null
      }

      let latestWorkout = null
      let latestWorkoutDate = null
      let clientInfo = null

      // Check each client for their latest workout
      for (const client of validClients) {
        try {
          const { getUserWorkouts } = await import("@/lib/firebase/workout-service")
          const { workouts, error } = await getUserWorkouts(client.userId)

          if (error || workouts.length === 0) {
            continue
          }

          // Find the most recent workout for this client
          let clientLatestWorkout = null
          let clientLatestDate = null

          for (const workout of workouts) {
            const workoutDate = parseWorkoutDate(workout)

            if (!workoutDate) {
              continue
            }

            if (!clientLatestDate || workoutDate > clientLatestDate) {
              clientLatestWorkout = workout
              clientLatestDate = workoutDate
            }
          }

          if (!clientLatestWorkout || !clientLatestDate) {
            continue
          }

          // Check if this is the latest workout overall
          if (!latestWorkoutDate || clientLatestDate > latestWorkoutDate) {
            latestWorkout = clientLatestWorkout
            latestWorkoutDate = clientLatestDate
            clientInfo = {
              id: client.id,
              name: client.name,
              initials: client.initials,
              bgColor: client.bgColor,
              textColor: client.textColor,
              userId: client.userId,
            }
          }
        } catch (clientError) {
          console.error(`Error fetching workouts for client ${client.name}:`, clientError)
        }
      }

      if (!latestWorkout || !clientInfo || !latestWorkoutDate) {
        return null
      }

      return {
        client: clientInfo,
        workout: latestWorkout,
        exercises: latestWorkout.exercises || [],
        personalRecords: latestWorkout.personalRecords || [],
        weeklyWorkouts: [],
        userId: clientInfo.userId,
      }
    } catch (error) {
      console.error("Error fetching latest workout across clients:", error)
      return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Overview</h1>
        </div>

        {/* Main Content */}
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
                    weeklyWorkouts={clientWorkout.weeklyWorkouts}
                    userId={clientWorkout.userId}
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
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 text-sm">Total Clients</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{revenue.activeClients}</p>
                      {revenue.activeClients === 0 && (
                        <Image
                          src="/sleeping-mascot.png"
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

                <ClientRequests trainerId={trainerId} hideTitle={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewPageClient
