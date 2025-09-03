"use client"

import { useState, useCallback, useEffect } from "react"
import { clientsPageStyles } from "../../../app/clients/styles"
import { FirebaseWorkout, WorkoutExercise, WorkoutSet } from "@/lib/firebase/workout-service"
import { OneRMChart } from "./one-rm"

interface WorkoutCardProps {
  clientId: string,
  userId: string,
  workout: FirebaseWorkout | null
}

export function WorkoutCard({ clientId, userId, workout }: WorkoutCardProps) {
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [setNumbers, setSetNumbers] = useState<Map<string, string> | null>(null)

  const buildSetNumber = (exercise: WorkoutExercise) => {
    // create a new map of string to string
    const setNumbers = new Map<string, string>()
    let setNumber = 1
    console.log("exercise.sets", exercise)
    exercise.sets.forEach((set) => {
      if (set.type === "warmup") {
        setNumbers.set(set.id, "W")
      } else {
        setNumbers.set(set.id, setNumber.toString())
        setNumber++
      }
    })
    setSetNumbers(setNumbers)
  }

  const selectExercise = useCallback((exercise: WorkoutExercise) => {
    setSelectedExercise(exercise)
    buildSetNumber(exercise)
  }, [buildSetNumber])

  useEffect(() => {
    console.log("workout exercises", workout?.exercises)
    if (workout && workout.exercises.length > 0) {
      selectExercise(workout.exercises[0])
    } else {
      setSelectedExercise(null)
      setSetNumbers(null)
    }
  }, [workout])

  if (!workout) {
    return (
      <div className={clientsPageStyles.workoutCard}>
        <h2 className={clientsPageStyles.workoutCardTitle}>No workout data available</h2>
      </div>
    )
  }

  const getExerciseStyle = (exercise: WorkoutExercise) => {
    if (selectedExercise?.id === exercise.id) {
        return clientsPageStyles.exerciseSelected
      } else {
        return clientsPageStyles.exerciseNotSelected
      }
  }

  const getSetText = (set: WorkoutSet) => {
    if (set.weight && set.weight > 0) {
      return set.weight + " kg × " + set.reps + " reps"
    } else if (set.reps && set.reps.length > 0) {
      return set.reps + " reps"
    } else {
      return "Incomplete"
    }
  }


  const getSetsTextStyle = (sets: number) => {
    return sets === 0 ? clientsPageStyles.setsTextIncomplete : clientsPageStyles.setsTextComplete
  }

  return (
    <div className={clientsPageStyles.workoutCard}>
      {/* Workout Header */}
      <h1 className={clientsPageStyles.workoutCardTitle}>
        Latest Workout: {workout.name}
      </h1>

      {/* Client Note */}
      {workout.notes && (
        <div className={clientsPageStyles.clientNoteSection}>
            <label className={clientsPageStyles.clientNoteLabel}>Client Note:</label>
            <label className={clientsPageStyles.clientNoteLabel}>{workout.notes}</label>
        </div>
      )}

      {/* Exercise List */}
      {workout.exercises.length > 0 ? (
      <div className={clientsPageStyles.exerciseListSection}>
        <div className={clientsPageStyles.exerciseGrid}>
          {workout.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className={getExerciseStyle(exercise)}
              onClick={() => selectExercise(exercise)}
            >
              <span className={clientsPageStyles.exerciseName}>{index + 1}. {exercise.name.length > 20 ? exercise.name.substring(0, 20) + "..." : exercise.name}</span>
              <span className={getSetsTextStyle(exercise.sets.length)}>
                {exercise.sets.length} sets
              </span>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className={clientsPageStyles.exerciseListSection}>
          <div className={clientsPageStyles.exerciseGrid}>
            <p>No exercises found</p>
          </div>
        </div>
      )}

      {/* Detailed Exercise View */}
      {selectedExercise && (
        <div className={clientsPageStyles.exerciseDetailSection}>
          <div className="grid grid-cols-2 gap-6">
            {/* Left side - Exercise name and sets */}
            <div>
              <h2 className={clientsPageStyles.exerciseDetailTitle}>{selectedExercise.name}</h2>

              {/* Sets Information */}
              <div className={clientsPageStyles.setsSection}>
                <h4 className={clientsPageStyles.setsTitle}>Sets</h4>
                <div className={clientsPageStyles.setsList}>
                  {selectedExercise.sets.map((set) => (
                    <div key={set.id} className={clientsPageStyles.setItem}>
                      <div className={clientsPageStyles.setItemNumber}>
                        {setNumbers?.get(set.id)}
                      </div>
                      <div className={clientsPageStyles.setItemWeight}>
                        {getSetText(set)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - View history and chart */}
            <div>
              <div className="flex justify-end mb-4">
                <a href={`/exercise-history/${userId}/${selectedExercise.id}`} target="_blank" className={clientsPageStyles.viewHistoryLink}>View history</a>
              </div>
              <OneRMChart clientId={clientId} exerciseId={selectedExercise.id}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
