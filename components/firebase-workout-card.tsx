"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dumbbell, Clock, Flame, Trophy, CheckCircle, AlertTriangle, Bug, Calendar } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"

interface FirebaseWorkoutCardProps {
  userId: string
  workoutId: string
}

export function FirebaseWorkoutCard({ userId, workoutId }: FirebaseWorkoutCardProps) {
  const [addWorkout, setAddWorkout] = useState(true)
  const [loading, setLoading] = useState(true)
  const [workout, setWorkout] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [iconColor, setIconColor] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [weeklyProgress, setWeeklyProgress] = useState({
    completed: 3,
    goal: 5,
    percentage: 60,
  })
  const [shouldUseFallback, setShouldUseFallback] = useState(false)
  const [rawData, setRawData] = useState<any>(null)

  // Use a ref to track if component is mounted
  const isMounted = useRef(true)

  // Add debug info function with console logging
  const addDebug = useCallback((message: string) => {
    console.log(`[FirebaseWorkoutCard] ${message}`)
    if (isMounted.current) {
      setDebugInfo((prev) => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`])
    }
  }, [])

  // Function to use fallback data
  const useFallbackData = useCallback(() => {
    if (!isMounted.current) return

    addDebug("Using fallback data")

    setWorkout({
      title: "Today's Workout",
      clientName: "Yotam",
      status: "Completed",
      completion: 92,
      duration: "45 min",
      calories: "320",
      newPR: "1 PR",
    })

    setExercises([
      {
        name: "Bench Press",
        sets: 4,
        reps: 10,
        previousWeight: "80kg",
        currentWeight: "85kg",
        isPR: false,
      },
      {
        name: "Squats",
        sets: 3,
        reps: 12,
        currentWeight: "100kg",
        isPR: false,
      },
      {
        name: "Deadlift",
        sets: 3,
        reps: 8,
        currentWeight: "120kg",
        isPR: true,
        improvement: "+5kg",
      },
    ])

    // Set demo weekly progress data
    setWeeklyProgress({
      completed: 3,
      goal: 5,
      percentage: 60,
    })

    setLoading(false)
    setUsingFallback(true)
  }, [addDebug])

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true

    return () => {
      addDebug("Component will unmount - setting isMounted to false")
      isMounted.current = false
    }
  }, [addDebug])

  // Process workout data from Firestore
  const processWorkoutData = useCallback(
    (workoutData: any) => {
      if (!isMounted.current) return

      addDebug("Processing workout data")
      addDebug(`Raw workout data: ${JSON.stringify(workoutData)}`)
      setRawData(workoutData)

      // Process exercises from the Firestore format
      const processedExercises: any[] = []

      if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
        addDebug(`Found ${workoutData.exercises.length} exercises in array format`)

        workoutData.exercises.forEach((exercise: any) => {
          if (!exercise) return

          const exerciseSets = exercise.sets || []
          const setCount = Array.isArray(exerciseSets) ? exerciseSets.length : 0
          const repCount = setCount > 0 && exerciseSets[0]?.reps ? exerciseSets[0].reps : 0

          // Find max weight across all sets
          let maxWeight = 0
          if (Array.isArray(exerciseSets)) {
            exerciseSets.forEach((set: any) => {
              if (set && set.weight && typeof set.weight === "number" && set.weight > maxWeight) {
                maxWeight = set.weight
              }
            })
          }

          processedExercises.push({
            name: exercise.name || "Unnamed Exercise",
            sets: setCount,
            reps: repCount,
            maxWeight: maxWeight > 0 ? `${maxWeight}kg` : "",
          })
        })
      }

      // If no exercises were found or processed, use fallback exercises
      if (processedExercises.length === 0) {
        addDebug("No exercises found or processed, using fallback exercises")
        processedExercises.push(
          {
            name: "Bench Press",
            sets: 4,
            reps: 10,
            maxWeight: "85kg",
          },
          {
            name: "Squats",
            sets: 3,
            reps: 12,
            maxWeight: "100kg",
          },
          {
            name: "Deadlift",
            sets: 3,
            reps: 8,
            maxWeight: "120kg",
          },
        )
      }

      setExercises(processedExercises)

      // Process workout metadata
      setWorkout({
        title: workoutData.name || "Today's Workout",
        clientName: workoutData.clientName || "Yotam",
        status: workoutData.status || "Completed",
        duration: workoutData.duration || "45 min",
        calories: workoutData.calories || "320",
        newPR: workoutData.newRecord || "777",
      })

      // Set weekly progress data (either from Firestore or default values)
      setWeeklyProgress({
        completed: workoutData.completedWorkouts || 3,
        goal: workoutData.weeklyGoal || 5,
        percentage: workoutData.weeklyPercentage || 60,
      })

      setLoading(false)
      addDebug("Workout data processing complete")
    },
    [addDebug],
  )

  // Fetch workout data
  useEffect(() => {
    addDebug("Starting fetchWorkout effect")

    // Create an AbortController to cancel fetch requests if component unmounts
    const abortController = new AbortController()
    let isEffectActive = true

    // Determine whether to use fallback data
    const path = typeof window !== "undefined" ? window.location.pathname : ""
    const isUserPage = path.includes("/users/") || path.includes("/share/users/")
    const shouldFallback = !isUserPage || !db

    // Initialize fallback data here, but don't set state directly
    let fallbackWorkoutData = null
    const fallbackExercises = [
      {
        name: "Bench Press",
        sets: 4,
        reps: 10,
        maxWeight: "85kg",
      },
      {
        name: "Squats",
        sets: 3,
        reps: 12,
        maxWeight: "100kg",
      },
      {
        name: "Deadlift",
        sets: 3,
        reps: 8,
        maxWeight: "120kg",
      },
    ]

    const fallbackWeeklyProgress = {
      completed: 3,
      goal: 5,
      percentage: 60,
    }
    if (shouldFallback) {
      addDebug("Should use fallback data based on path or missing db")
      fallbackWorkoutData = {
        title: "Today's Workout",
        clientName: "Yotam",
        status: "Completed",
        completion: 92,
        duration: "45 min",
        calories: "320",
        newPR: "1 PR",
      }

      if (isEffectActive && isMounted.current) {
        // useFallbackData() // Removed direct call to useFallbackData
        setWorkout(fallbackWorkoutData)
        setExercises(fallbackExercises)
        setWeeklyProgress(fallbackWeeklyProgress)
        setLoading(false)
        setUsingFallback(true)
      }
      return
    }

    async function fetchWorkout() {
      try {
        if (!isMounted.current) return

        addDebug("fetchWorkout function called")
        addDebug(`Starting fetch for userId: ${userId}, workoutId: ${workoutId}`)

        // Try global workouts collection first
        let workoutDoc = null
        let workoutExists = false

        try {
          addDebug("Attempting to create global workout reference")
          const workoutRef = doc(db, `workouts/${workoutId}`)
          addDebug(`Created global workout reference: workouts/${workoutId}`)

          addDebug("Fetching global workout document")
          workoutDoc = await getDoc(workoutRef)
          workoutExists = workoutDoc.exists()
          addDebug(`Global workout exists: ${workoutExists}`)
        } catch (err) {
          if (!isMounted.current || !isEffectActive) return
          addDebug(`Error fetching global workout: ${err instanceof Error ? err.message : String(err)}`)
        }

        // If not found, try user's workouts collection
        if (!workoutExists) {
          try {
            addDebug("Global workout not found, trying user-specific workout")
            const userWorkoutRef = doc(db, `users/${userId}/workouts/${workoutId}`)
            addDebug(`Created user workout reference: users/${userId}/workouts/${workoutId}`)

            workoutDoc = await getDoc(userWorkoutRef)
            workoutExists = workoutDoc.exists()
            addDebug(`User-specific workout exists: ${workoutExists}`)
          } catch (err) {
            if (!isMounted.current || !isEffectActive) return
            addDebug(`Error fetching user workout: ${err instanceof Error ? err.message : String(err)}`)
          }
        }

        if (workoutExists && workoutDoc) {
          if (!isMounted.current || !isEffectActive) return

          addDebug("Workout document found, processing data")
          const workoutData = workoutDoc.data()

          if (isEffectActive && isMounted.current && workoutData) {
            processWorkoutData(workoutData)
          }
        } else {
          // Use fallback data if no workout found
          addDebug("No workout found, using fallback data")
          if (isEffectActive && isMounted.current) {
            // useFallbackData() // Removed direct call to useFallbackData
            setWorkout(fallbackWorkoutData)
            setExercises(fallbackExercises)
            setWeeklyProgress(fallbackWeeklyProgress)
            setLoading(false)
            setUsingFallback(true)
          }
        }
      } catch (err) {
        if (!isMounted.current || !isEffectActive) return

        addDebug(`Error in fetchWorkout: ${err instanceof Error ? err.message : String(err)}`)
        setError(`Failed to load workout data: ${err instanceof Error ? err.message : String(err)}`)
        // Use fallback data on error
        if (isEffectActive && isMounted.current) {
          // useFallbackData() // Removed direct call to useFallbackData
          setWorkout(fallbackWorkoutData)
          setExercises(fallbackExercises)
          setWeeklyProgress(fallbackWeeklyProgress)
          setLoading(false)
          setUsingFallback(true)
        }
      } finally {
        if (isMounted.current && isEffectActive) {
          setLoading(false)
          addDebug("Fetch workout complete")
        }
      }
    }

    fetchWorkout()

    return () => {
      addDebug("Fetch workout effect cleanup - cancelling any pending operations")
      isEffectActive = false
      abortController.abort()
    }
  }, [userId, workoutId, addDebug, processWorkoutData, useFallbackData])

  // Debug panel component
  const DebugPanel = () => (
    <div className="mt-6 border rounded-md p-4 bg-gray-50 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-sm">Debug Information</h4>
        <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-700">
          Hide
        </button>
      </div>

      <div className="mb-4">
        <div className="font-semibold mb-1">Component State:</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Loading: {loading ? "true" : "false"}</li>
          <li>Using Fallback: {usingFallback ? "true" : "false"}</li>
          <li>Icon Color: {iconColor ? "#d2ff28" : "black"}</li>
          <li>Error: {error || "none"}</li>
          <li>Workout: {workout ? "loaded" : "not loaded"}</li>
          <li>Exercises: {exercises.length}</li>
          <li>
            Weekly Progress: {weeklyProgress.completed}/{weeklyProgress.goal} ({weeklyProgress.percentage}%)
          </li>
          <li>Path: {typeof window !== "undefined" ? window.location.pathname : "unknown"}</li>
        </ul>
      </div>

      <div className="mb-2">
        <div className="font-semibold mb-1">Props:</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>userId: {userId}</li>
          <li>workoutId: {workoutId}</li>
        </ul>
      </div>

      {rawData && (
        <div className="mb-4">
          <div className="font-semibold mb-1">Raw Workout Data:</div>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <div className="font-semibold mb-1">Log ({debugInfo.length} entries):</div>
        <div className="max-h-40 overflow-y-auto border rounded bg-gray-100 p-2">
          {debugInfo.map((log, i) => (
            <div key={i} className="border-b border-gray-200 py-1 last:border-0">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-center text-muted-foreground">Loading workout data...</p>

          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 mx-auto"
          >
            <Bug size={12} />
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>

          {showDebug && <DebugPanel />}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-center items-center flex-col">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <div className="text-center mb-6">
              <p className="text-destructive font-medium mb-2">Something went wrong!</p>
              <p className="text-muted-foreground mb-4">We couldn't load the workout you're looking for.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    setShouldUseFallback(false)
                  }}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/90"
                >
                  Try again
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-4"
            >
              <Bug size={12} />
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>

            {showDebug && <DebugPanel />}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!workout) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-center items-center flex-col">
            <div className="text-center mb-6">
              <p className="font-medium mb-2">Workout not found</p>
              <p className="text-muted-foreground mb-4">The requested workout could not be found.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setLoading(true)
                    useFallbackData()
                  }}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-black/90"
                >
                  Use sample workout
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-4"
            >
              <Bug size={12} />
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>

            {showDebug && <DebugPanel />}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{workout.title}</h2>
            <p className="text-sm text-muted-foreground">
              Shared by {workout.clientName} • {workout.status}
            </p>
          </div>
          <div
            className={`${iconColor ? "bg-[#d2ff28] text-black" : "bg-black text-white"} w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors`}
            onClick={() => {
              console.log("Toggle icon color clicked, current state:", iconColor)
              setIconColor(!iconColor)
            }}
          >
            <Dumbbell className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Weekly Progress Section - Keep this but remove the percentage text */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">Weekly Progress</span>
              </div>
              <span className="text-sm font-medium">
                {weeklyProgress.completed}/{weeklyProgress.goal} workouts
              </span>
            </div>
            <div>
              <Progress value={weeklyProgress.percentage} className="h-2" />
              {/* Removed the "% of weekly goal" text */}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-background p-3 rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-medium">{workout.duration}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="bg-background p-3 rounded-lg">
              <Flame className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-medium">{workout.calories}</div>
              <div className="text-xs text-muted-foreground">Calories</div>
            </div>
            <div className="bg-background p-3 rounded-lg">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <div className="text-sm font-medium">{workout.newPR}</div>
              <div className="text-xs text-muted-foreground">New Record</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Exercises</h3>

            {exercises.length > 0 ? (
              exercises.map((exercise, index) => (
                <div key={index} className="py-3 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps} reps
                      </div>
                    </div>
                    {exercise.maxWeight ? (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{exercise.maxWeight}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-3 text-center text-muted-foreground">No exercises found</div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Label htmlFor="add-workout" className="text-sm">
              Add to Juice upon log in
            </Label>
            <Switch id="add-workout" checked={addWorkout} onCheckedChange={setAddWorkout} />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Bug size={12} />
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
        </div>

        {showDebug && <DebugPanel />}
      </CardContent>
    </Card>
  )
}
