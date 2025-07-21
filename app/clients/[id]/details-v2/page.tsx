"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Mail, Phone, Edit, FileText, Calendar, Dumbbell, Trophy } from "lucide-react"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { getClient, updateClient } from "@/lib/firebase/client-service"
import { getUserWorkouts, getClientWorkouts } from "@/lib/firebase/workout-service"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { Button } from "@/components/ui/button"

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [clientData, set_clientData] = useState<any>(null)
  const [workouts, setWorkouts] = useState<any[]>([])
  const clientId = params.id as string
  const { error, handleError } = useErrorHandler({
    context: { component: "ClientDetailPage", clientId },
  })

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  useEffect(() => {
    let isMounted = true
    let hasStartedFetch = false

    const fetchClientData = async () => {
      if (!isMounted || hasStartedFetch) return
      hasStartedFetch = true

      setIsLoading(true)
      try {
        // Get trainer ID from cookie with improved cookie reading
        const getCookie = (name) => {
          if (typeof document === "undefined") return null
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(";").shift()
          return null
        }

        // Try multiple cookie names that might contain the trainer ID
        let trainerId = getCookie("trainerUID") || getCookie("user_id") || getCookie("trainer_id")

        // If still no trainer ID, try to get it from localStorage as fallback
        if (!trainerId && typeof window !== "undefined") {
          trainerId = localStorage.getItem("trainerUID") || localStorage.getItem("user_id")
        }

        // For demo purposes, use a fallback ID if in development or if URL contains 'demo'
        if (!trainerId) {
          if (process.env.NODE_ENV === "development" || window.location.href.includes("demo")) {
            console.log("Using demo trainer ID")
            trainerId = "demoTrainerId123"
          } else {
            console.error("Trainer ID not found in cookies or localStorage. Available cookies:", document.cookie)
            throw new Error("Trainer ID not found")
          }
        }

        console.log("Using trainer ID:", trainerId)

        // Fetch client data directly from Firebase
        const client = await getClient(trainerId, clientId)

        if (!client) {
          throw new Error("Client not found")
        }

        if (isMounted) {
          set_clientData(client)

          // Enhanced debugging
          console.log("=== DEBUGGING CLIENT WORKOUT FETCH ===")
          console.log("Client data:", JSON.stringify(client, null, 2))
          console.log("Client ID:", clientId)
          console.log("Trainer ID:", trainerId)
          console.log("Client userId:", client.userId)

          // Try multiple approaches to find workouts
          try {
            // Approach 1: Direct user workouts collection
            if (client.userId) {
              console.log("🔍 Approach 1: Fetching from users/{userId}/workouts")
              console.log("Path: users/" + client.userId + "/workouts")

              const { workouts: userWorkouts, error: userWorkoutsError } = await getUserWorkouts(client.userId)
              console.log("User workouts result:", {
                count: userWorkouts?.length || 0,
                workouts: userWorkouts,
                error: userWorkoutsError,
              })

              if (!userWorkoutsError && userWorkouts && userWorkouts.length > 0) {
                console.log("✅ Found workouts in user collection!")
                const groupedWorkouts = groupWorkoutsByWeek(userWorkouts)
                if (isMounted) {
                  setWorkouts(groupedWorkouts)
                }
                return
              }
            }

            // Approach 2: Trainer's client workouts collection
            console.log("🔍 Approach 2: Fetching from users/{trainerId}/clients/{clientId}/workouts")
            console.log("Path: users/" + trainerId + "/clients/" + clientId + "/workouts")

            const workoutData = await getClientWorkouts(trainerId, clientId)
            console.log("Client workouts result:", {
              count: workoutData?.length || 0,
              workouts: workoutData,
            })

            // Approach 3: Try alternative paths that might exist
            console.log("🔍 Approach 3: Checking if client has alternative workout paths")

            // Let's also try to fetch directly from Firebase to see what collections exist
            if (typeof window !== "undefined" && window.firebase) {
              try {
                const db = window.firebase.firestore()

                // Check what subcollections exist under this client
                console.log("🔍 Checking subcollections under client document...")

                // Try to list all documents in potential workout collections
                const potentialPaths = [
                  `users/${trainerId}/clients/${clientId}/workouts`,
                  `users/${client.userId}/workouts`,
                  `clients/${clientId}/workouts`,
                  `workouts/${clientId}`,
                  `trainers/${trainerId}/clients/${clientId}/workouts`,
                ]

                for (const path of potentialPaths) {
                  try {
                    console.log(`🔍 Checking path: ${path}`)
                    const snapshot = await db.collection(path).limit(1).get()
                    console.log(`Path ${path}: ${snapshot.size} documents found`)
                    if (snapshot.size > 0) {
                      console.log("Sample document:", snapshot.docs[0].data())
                    }
                  } catch (pathError) {
                    console.log(`Path ${path}: Error -`, pathError.message)
                  }
                }
              } catch (firebaseError) {
                console.log("Firebase direct access error:", firebaseError)
              }
            }

            const groupedWorkouts = groupWorkoutsByWeek(workoutData || [])
            if (isMounted) {
              setWorkouts(groupedWorkouts)
            }
          } catch (workoutError) {
            console.error("❌ Error fetching workouts:", workoutError)
            if (isMounted) {
              setWorkouts([])
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error in fetchClientData:", err)
          handleError(err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchClientData()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [clientId]) // Only depend on clientId, remove handleError dependency

  // Sync edited notes with client data
  useEffect(() => {
    if (clientData?.notes) {
      setEditedNotes(clientData.notes)
    }
  }, [clientData?.notes])

  // Helper function to group workouts by week
  const groupWorkoutsByWeek = (workoutData: any[]) => {
    if (!workoutData || workoutData.length === 0) {
      return [
        {
          week: "Current Week",
          sessions: [],
        },
      ]
    }

    // Group by week logic here
    const weeks: { [key: string]: any } = {}
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay()) // Get start of current week (Sunday)

    // Format for current week
    const currentWeekKey = `Week of ${currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

    // Initialize current week
    weeks[currentWeekKey] = {
      week: currentWeekKey,
      sessions: [],
      isCurrent: true,
    }

    workoutData.forEach((workout) => {
      // Handle different date formats
      let workoutDate
      if (workout.startedAt && typeof workout.startedAt === "object" && workout.startedAt.seconds) {
        workoutDate = new Date(workout.startedAt.seconds * 1000)
      } else if (workout.createdAt && typeof workout.createdAt === "object" && workout.createdAt.seconds) {
        workoutDate = new Date(workout.createdAt.seconds * 1000)
      } else if (workout.date) {
        workoutDate = new Date(workout.date)
      } else {
        workoutDate = new Date() // Fallback to current date
      }

      const weekStart = new Date(workoutDate)
      weekStart.setDate(workoutDate.getDate() - workoutDate.getDay()) // Get start of week (Sunday)
      const weekKey = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: weekKey,
          sessions: [],
          isCurrent: weekStart.getTime() === currentWeekStart.getTime(),
        }
      }

      // Format the workout data
      const formattedWorkout = {
        id: workout.id,
        name: workout.name || workout.focus || "Workout",
        date: formatDate(workout.startedAt || workout.createdAt),
        duration: formatDuration(workout),
        color: getWorkoutColor(workout),
        expanded: false,
        exercises: formatExercises(workout.exercises || []),
        status: workout.status,
        notes: workout.notes || "",
        personalRecords: workout.personalRecords || [],
        completedAt: workout.completedAt, // Add this line
      }

      weeks[weekKey].sessions.push(formattedWorkout)
    })

    // Sort weeks by date (most recent first)
    return Object.values(weeks).sort((a: any, b: any) => {
      const dateA = new Date(a.week.replace("Week of ", ""))
      const dateB = new Date(b.week.replace("Week of ", ""))
      return dateB.getTime() - dateA.getTime()
    })
  }

  // Helper function to format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    try {
      // Handle Firestore timestamp
      if (typeof timestamp === "object" && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }

      // Handle string date
      return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (e) {
      console.error("Date formatting error:", e)
      return "N/A"
    }
  }

  // Helper function to format duration
  const formatDuration = (workout: any) => {
    let durationMinutes = 0

    if (workout.duration) {
      durationMinutes = Number.parseInt(workout.duration)
    } else if (
      workout.completedAt &&
      workout.startedAt &&
      typeof workout.completedAt === "object" &&
      workout.completedAt.seconds &&
      typeof workout.startedAt === "object" &&
      workout.startedAt.seconds
    ) {
      durationMinutes = Math.round((workout.completedAt.seconds - workout.startedAt.seconds) / 60)
    } else {
      return "N/A"
    }

    // Convert to hours and minutes if over 60 minutes
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60

      if (minutes === 0) {
        return `${hours}h`
      } else {
        return `${hours}h ${minutes}m`
      }
    } else {
      return `${durationMinutes} min`
    }
  }

  // Helper function to get workout color
  const getWorkoutColor = (workout: any) => {
    if (!workout.status) return "bg-primary"

    switch (workout.status.toLowerCase()) {
      case "completed":
        return "bg-primary"
      case "in-progress":
        return "bg-yellow-300"
      case "missed":
        return "bg-red-300"
      default:
        return "bg-primary"
    }
  }

  // Helper function to format exercises
  const formatExercises = (exercises: any[]) => {
    return exercises.map((exercise) => {
      return {
        ...exercise,
      }
    })
  }

  const toggleWorkoutExpand = (weekIndex: number, workoutIndex: number) => {
    setWorkouts((prevWorkouts) => {
      const newWorkouts = [...prevWorkouts]
      const workout = newWorkouts[weekIndex].sessions[workoutIndex]
      workout.expanded = !workout.expanded
      return newWorkouts
    })
  }

  const handleEditNotesClick = () => {
    console.log("🖊️ Edit notes button clicked")
    console.log("Current client notes:", clientData?.notes)
    setEditedNotes(clientData?.notes || "")
    setIsEditingNotes(true)
  }

  const handleSaveNotes = async () => {
    console.log("💾 Save notes clicked")
    console.log("Edited notes content:", editedNotes)
    console.log("Client ID:", clientId)

    setIsSavingNotes(true)

    try {
      // Get trainer ID (same logic as in fetchClientData)
      const getCookie = (name) => {
        if (typeof document === "undefined") return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift()
        return null
      }

      let trainerId = getCookie("trainerUID") || getCookie("user_id") || getCookie("trainer_id")

      if (!trainerId && typeof window !== "undefined") {
        trainerId = localStorage.getItem("trainerUID") || localStorage.getItem("user_id")
      }

      if (!trainerId) {
        if (process.env.NODE_ENV === "development" || window.location.href.includes("demo")) {
          trainerId = "demoTrainerId123"
        } else {
          throw new Error("Trainer ID not found")
        }
      }

      console.log("Using trainer ID for notes update:", trainerId)

      const result = await updateClient(trainerId, clientId, {
        notes: editedNotes,
      })

      console.log("Update result:", result)

      if (result.success) {
        console.log("✅ Notes saved successfully!")
        // Update local state
        set_clientData((prev) => ({
          ...prev,
          notes: editedNotes,
        }))
        setIsEditingNotes(false)
      } else {
        console.error("❌ Failed to save notes:", result.error)
        handleError(result.error)
      }
    } catch (error) {
      console.error("❌ Error saving notes:", error)
      handleError(error)
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleCancelEdit = () => {
    console.log("❌ Cancel edit notes clicked")
    setEditedNotes(clientData?.notes || "")
    setIsEditingNotes(false)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Client</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white">
      {/* Client Header */}
      <div className="w-full border-b border-gray-200 bg-white">
        <div className="w-full p-6 flex flex-col">
          <div className="flex">
            <div className="pr-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
                <img
                  src={
                    clientData.avatarUrl ||
                    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f40cd549493308d07082565b9e3c7aac83a59e0d-9jeksWlxLU0OCSOBLxNuwlrKxabUcv.png" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={clientData.name || "Client"}
                  className="w-24 h-24 object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="flex items-center">
                  <div className="text-gray-900 text-2xl font-bold font-sans leading-loose">
                    {clientData.name || "N/A"}
                  </div>
                </div>
                <div className="ml-4 px-3 py-1 bg-primary rounded-lg flex justify-center items-center">
                  <div className="text-center text-zinc-700 text-xs font-medium font-sans leading-none">
                    {clientData.status || "Active client"}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex flex-col">
                  <div className="pb-1">
                    <div className="flex items-center">
                      <div className="pr-2">
                        <Mail className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div className="text-gray-600 text-sm font-normal font-secondary leading-tight">
                        {clientData.email || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="pr-2">
                      <Phone className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                    <div className="text-gray-600 text-sm font-normal font-secondary leading-tight">
                      {clientData.phone || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex gap-2 flex-wrap">
                  {clientData.goal ? (
                    <div className="px-3 py-1 bg-gray-100 rounded-full flex items-center">
                      <div className="pr-1">
                        <Trophy className="w-3.5 h-3.5 text-gray-700" />
                      </div>
                      <div className="text-gray-800 text-sm font-medium font-secondary leading-tight">
                        {clientData.goal}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-gray-100 rounded-full flex items-center">
                      <div className="text-gray-800 text-sm font-medium font-secondary leading-tight">No goals set</div>
                    </div>
                  )}

                  {clientData.program && (
                    <div className="px-3 py-1 bg-gray-100 rounded-full flex items-center">
                      <div className="pr-1">
                        <Dumbbell className="w-3.5 h-3.5 text-gray-700" />
                      </div>
                      <div className="text-gray-800 text-sm font-medium font-secondary leading-tight">
                        {clientData.program}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex">
                <div className="pt-0.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <div className="pl-2 flex-1">
                  <div className="text-gray-900 text-sm font-medium font-sans leading-tight">Trainer Notes</div>
                  <div className="pt-1">
                    {isEditingNotes ? (
                      <div className="space-y-3">
                        <textarea
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          placeholder="Add notes about this client..."
                          className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={4}
                          disabled={isSavingNotes}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="px-3 py-1.5 bg-primary text-gray-800 text-sm font-medium rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingNotes ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingNotes}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-600 text-sm font-normal font-secondary leading-tight">
                        {clientData?.notes || "No notes available for this client."}
                      </div>
                    )}
                  </div>
                </div>
                {!isEditingNotes && (
                  <button
                    onClick={handleEditNotesClick}
                    className="w-5 h-8 p-px bg-white rounded-full outline outline-1 outline-offset-[-1px] outline-gray-200 flex justify-center items-center hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workouts Section */}
      <div className="w-full p-6">
        <div className="p-5 bg-white rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-200">
          <div className="pb-4">
            <div className="flex justify-between items-center">
              <div className="text-gray-900 text-lg font-semibold font-sans leading-7">Latest Workouts</div>
              <Button className="gap-2 bg-black hover:bg-gray-800 text-white">
                <Edit className="w-4 h-4" />
                Assign Workout
              </Button>
            </div>
          </div>

          {workouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No workouts found for this client.</div>
          ) : (
            workouts.map((weekData, weekIndex) => (
              <div key={weekIndex} className="mb-8">
                <div className="pb-4">
                  <div className="flex">
                    <div className="flex items-center">
                      <div className="pr-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="text-gray-500 text-base font-normal font-secondary leading-normal">
                        {weekData.week}{" "}
                        {weekData.sessions.some((session: any) => !session.completedAt) && (
                          <span className="text-lime-600 font-medium">(Happening Now)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {weekData.sessions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No workouts for this week.</div>
                ) : (
                  weekData.sessions.map((workout: any, workoutIndex: number) => (
                    <div
                      key={workoutIndex}
                      className={`mb-4 rounded-2xl outline outline-1 outline-offset-[-1px] outline-gray-200 overflow-hidden`}
                    >
                      <div
                        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleWorkoutExpand(weekIndex, workoutIndex)}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-2xl flex justify-center items-center ${workout.color}`}>
                            <Dumbbell className="w-5 h-5 text-gray-800" />
                          </div>
                          <div className="pl-4">
                            <div className="flex flex-col">
                              <div className="text-gray-900 text-base font-medium font-sans leading-normal">
                                {workout.name}
                              </div>
                              <div className="text-gray-500 text-sm font-normal font-secondary leading-tight">
                                {workout.date} · {workout.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 21 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transform ${workout.expanded ? "" : "rotate-180"}`}
                          >
                            <path
                              d="M10.5702 10.8834L14.6858 6.76673L15.8688 7.9334L10.5702 13.2334L5.27148 7.9334L6.45452 6.76673L10.5702 10.8834Z"
                              fill="#9CA3AF"
                            />
                          </svg>
                        </div>
                      </div>

                      {workout.expanded && (
                        <div className="px-4 py-4 border-t border-gray-200">
                          {/* Workout Notes */}
                          {workout.notes && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                              <p className="text-sm text-gray-600">{workout.notes}</p>
                            </div>
                          )}

                          {/* Exercises */}
                          {workout.exercises && workout.exercises.length > 0 ? (
                            <div className="space-y-6">
                              {workout.exercises.map((exercise: any, exerciseIndex: number) => (
                                <div key={exerciseIndex}>
                                  <div className="text-gray-900 font-medium font-sans mb-2">
                                    {exercise.name || "Unnamed Exercise"}
                                  </div>

                                  {exercise.sets && exercise.sets.length > 0 && (
                                    <div className="space-y-1">
                                      {exercise.sets.map((set: any, setIndex: number) => (
                                        <div key={setIndex} className="flex items-start">
                                          <div className="w-14 text-gray-700 font-medium">Set {setIndex + 1}:</div>
                                          <div className="w-24 text-gray-700">
                                            {set.weight ? `${set.weight} kg` : "N/A"} × {set.reps || "N/A"}
                                          </div>
                                          {set.type && set.type.toLowerCase() === "warmup" && (
                                            <div className="text-gray-500 ml-2">Warm-up</div>
                                          )}
                                          {set.progress && (
                                            <div className="text-green-500 ml-2">+{set.progress} from last session</div>
                                          )}
                                          {set.isPR && <div className="text-amber-500 ml-2">🏆 PR</div>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-2">No exercises recorded</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
