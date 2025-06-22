"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import {
  fetchClientData,
  fetchWorkoutData,
  fetchExerciseData,
  fetchPersonalRecords,
  fetchAllWorkoutsForClient,
  fetchWeeklyWorkouts,
} from "@/utils/api"
import ClientWorkoutView from "@/components/ClientWorkoutView"

const ClientWorkoutPage = () => {
  const { user } = useAuth()
  const params = useParams()
  const [clientData, setClientData] = useState(null)
  const [workoutData, setWorkoutData] = useState(null)
  const [exerciseData, setExerciseData] = useState(null)
  const [personalRecords, setPersonalRecords] = useState(null)
  const [allWorkouts, setAllWorkouts] = useState(null)
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTrainerId, setCurrentTrainerId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const clientId = params.userId
        const workoutId = params.workoutId

        console.log(`Fetching data for clientId: ${clientId}, workoutId: ${workoutId}`)

        // Add try/catch blocks for each fetch to identify which one is failing
        let client, workout, exercises, personalRecordsData, allWorkoutsData, weeklyWorkoutsData

        try {
          client = await fetchClientData(clientId)
          console.log("Client data fetched:", client ? "success" : "null")
        } catch (err) {
          console.error("Error fetching client data:", err)
        }

        try {
          workout = await fetchWorkoutData(workoutId)
          console.log("Workout data fetched:", workout ? "success" : "null")
        } catch (err) {
          console.error("Error fetching workout data:", err)
        }

        try {
          exercises = await fetchExerciseData(workoutId)
          console.log("Exercise data fetched:", exercises ? "success" : "null")
        } catch (err) {
          console.error("Error fetching exercise data:", err)
        }

        try {
          personalRecordsData = await fetchPersonalRecords(clientId)
          console.log("Personal records fetched:", personalRecordsData ? "success" : "null")
        } catch (err) {
          console.error("Error fetching personal records:", err)
        }

        try {
          allWorkoutsData = await fetchAllWorkoutsForClient(clientId)
          console.log("All workouts fetched:", allWorkoutsData ? "success" : "null")
        } catch (err) {
          console.error("Error fetching all workouts:", err)
        }

        try {
          weeklyWorkoutsData = await fetchWeeklyWorkouts(clientId)
          console.log("Weekly workouts fetched:", weeklyWorkoutsData ? "success" : "null")
        } catch (err) {
          console.error("Error fetching weekly workouts:", err)
        }

        setClientData(client)
        setWorkoutData(workout)
        setExerciseData(exercises)
        setPersonalRecords(personalRecordsData)
        setAllWorkouts(allWorkoutsData)
        setWeeklyWorkouts(weeklyWorkoutsData)
        setCurrentTrainerId(client?.trainerId || null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || "An error occurred while fetching data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.userId, params.workoutId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!clientData || !workoutData || !exerciseData) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Data Not Found</h2>
        <p className="text-gray-600">
          {!clientData ? "Client data is missing. " : ""}
          {!workoutData ? "Workout data is missing. " : ""}
          {!exerciseData ? "Exercise data is missing. " : ""}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div>
      <ClientWorkoutView
        client={clientData}
        workout={workoutData}
        exercises={exerciseData}
        personalRecords={personalRecords}
        isMockData={false}
        allClientWorkouts={allWorkouts}
        userId={params.userId} // Make sure this is passed
        clientId={params.userId} // Also pass as clientId for fallback
        weeklyWorkouts={weeklyWorkouts}
        trainerId={currentTrainerId}
      />
    </div>
  )
}

export default ClientWorkoutPage
