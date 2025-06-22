"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Plus, ChevronDown, Clock, Calendar, Dumbbell } from "lucide-react"
import type { FirebaseWorkout, WorkoutExercise } from "@/lib/firebase/workout-service"
import Link from "next/link"
import { usePathDetection } from "@/lib/hooks/use-path-detection"

interface ClientWorkoutsProps {
  clientId: string
  clientName: string
}

export function ClientWorkouts({ clientId, clientName }: ClientWorkoutsProps) {
  const [workouts, setWorkouts] = useState<FirebaseWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({})
  const { isDemoMode } = usePathDetection()

  useEffect(() => {
    async function fetchWorkouts() {
      if (!clientId) return

      setIsLoading(true)
      try {
        console.log("ClientWorkouts: Fetching workouts for client ID:", clientId)

        // Make sure we're using the correct API endpoint
        const response = await fetch(`/api/clients/${clientId}/workouts`)

        if (!response.ok) {
          console.error("ClientWorkouts: API response not OK:", response.status, response.statusText)
          throw new Error(`Failed to fetch workouts: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("ClientWorkouts: Received data:", data)

        setWorkouts(data.workouts || [])
      } catch (err) {
        console.error("ClientWorkouts: Error fetching workouts:", err)
        setError(err instanceof Error ? err.message : "Failed to load workouts")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkouts()
  }, [clientId])

  const toggleWorkoutExpand = (workoutId: string) => {
    setExpandedWorkouts((prev) => ({
      ...prev,
      [workoutId]: !prev[workoutId],
    }))
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "No date"

    try {
      // Handle Firestore timestamps
      if (timestamp && typeof timestamp === "object" && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000)
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      }

      // Handle string dates
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return "Invalid date format"

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      console.error("Date formatting error:", e)
      return "Date error"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-300"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const basePath = isDemoMode ? "/demo" : ""

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Workouts
        </CardTitle>
        <Button className="gap-2 bg-black hover:bg-gray-800 text-white">
          <Plus className="w-4 h-4" />
          Assign Workout
        </Button>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No workouts found for this client.</p>
            <p className="text-sm text-gray-400">
              {!isDemoMode && "The client may not have created an account yet or hasn't completed any workouts."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div key={workout.id} className="border rounded-md overflow-hidden">
                <div
                  className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleWorkoutExpand(workout.id)}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      <Activity className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{workout.name || workout.focus || "Workout"}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{formatDate(workout.startedAt || workout.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{workout.duration ? `${workout.duration} min` : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedWorkouts[workout.id] ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {expandedWorkouts[workout.id] && (
                  <div className="p-4 border-t">
                    {/* Workout Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p>{formatDate(workout.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p>{workout.completedAt ? formatDate(workout.completedAt) : "Not completed"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p>{workout.duration ? `${workout.duration} minutes` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p>{workout.status || "N/A"}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {workout.notes && (
                      <div className="mb-4">
                        <p className="text-gray-500 mb-1">Notes</p>
                        <p className="bg-gray-50 p-2 rounded">{workout.notes}</p>
                      </div>
                    )}

                    {/* Exercises */}
                    {workout.exercises && workout.exercises.length > 0 ? (
                      <div>
                        <p className="font-medium mb-2 text-sm">Exercises ({workout.exercises.length})</p>
                        <div className="space-y-3">
                          {workout.exercises.map((exercise: WorkoutExercise, index: number) => (
                            <div key={exercise.id || index} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex items-center mb-2">
                                <Dumbbell className="w-4 h-4 mr-2 text-gray-600" />
                                <p className="font-medium text-sm">{exercise.name || "Unnamed Exercise"}</p>
                              </div>

                              {exercise.sets && exercise.sets.length > 0 && (
                                <div className="ml-6">
                                  <p className="text-sm text-gray-500 mb-1">Sets: {exercise.sets.length}</p>
                                  <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="font-medium">Set</div>
                                    <div className="font-medium">Type</div>
                                    <div className="font-medium">Reps</div>
                                    <div className="font-medium">Weight</div>

                                    {exercise.sets.map((set, setIndex) => (
                                      <React.Fragment key={set.id || setIndex}>
                                        <div>{setIndex + 1}</div>
                                        <div>{set.type || "N/A"}</div>
                                        <div>{set.reps || "N/A"}</div>
                                        <div>{set.weight ? `${set.weight} kg` : "N/A"}</div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No exercises recorded</p>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Link href={`${basePath}/clients/${clientId}/workouts/${workout.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
