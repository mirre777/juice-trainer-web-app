"use client"

import { useEffect, useState } from "react"
import { Client } from "@/types/client"
import { clientsPageStyles } from "../../../app/clients/styles"
import { ClientDetailsHeader } from "./client-details-header"
import { NoClientSelected } from "./no-client-selected"
import { WorkoutCard } from "./workout-card"
import { FirebaseWorkout } from "@/lib/firebase/workout-service"

interface ClientDetailsProps {
  clientId: string | null
  trainerInviteCode: string
  onClientDeleted?: () => void
  onClientUpdated?: (client: Client) => void
  refreshTrigger: number
}

export function ClientDetails({ clientId, trainerInviteCode, onClientDeleted, onClientUpdated, refreshTrigger }: ClientDetailsProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [workouts, setWorkouts] = useState<FirebaseWorkout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<FirebaseWorkout | null>(null)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setClient(null)
        return
      }
      const [client, workouts] = await Promise.all([fetchClientInfo(), fetchWorkouts(startDate, endDate)])
      if (client) {
        setClient(client)
      }
      if (workouts) {
        setWorkouts(workouts)
        setSelectedWorkout(getLatestWorkout(workouts) || null)
      }
    }
    fetchClientData()
  }, [clientId, refreshTrigger, startDate, endDate])

  const fetchClientInfo: () => Promise<Client> = async () => {
    const clientResponse = await fetch(`/api/clients/${clientId}`)
    return await clientResponse.json() as Client
  }

  const fetchWorkouts: (startDate: Date, endDate: Date) => Promise<FirebaseWorkout[]> = async (startDate: Date, endDate: Date) => {
    // Format dates as ISO strings for the API
    const startDateISO = startDate.toISOString()
    const endDateISO = endDate.toISOString()

    const workoutsResponse = await fetch(`/api/clients/${clientId}/workouts?startDate=${startDateISO}&endDate=${endDateISO}`)
    const { workouts: fetchedWorkouts } = await workoutsResponse.json()
    return fetchedWorkouts as FirebaseWorkout[]
  }

  const getLatestWorkout = (workouts: FirebaseWorkout[]): FirebaseWorkout | null => {
    return workouts.sort((a, b) => new Date(b.completedAt ?? new Date()).getTime() - new Date(a.completedAt ?? new Date()).getTime())[0] || null
  }

  const handleWorkoutSelect = (workout: FirebaseWorkout | null) => {
    setSelectedWorkout(workout)
  }

  const handleWeekChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const [trainerNote, setTrainerNote] = useState(client?.notes || "")

  return (
    client ? (
    <div className={clientsPageStyles.detailsContent}>
      {/* Client Header */}
      <ClientDetailsHeader
        client={client}
        workouts={workouts}
        selectedWorkout={selectedWorkout}
        startDate={startDate}
        endDate={endDate}
        handleWorkoutSelect={handleWorkoutSelect}
        onWeekChange={handleWeekChange}
        trainerInviteCode={trainerInviteCode}
        onClientDeleted={onClientDeleted}
        onClientUpdated={onClientUpdated}
      />

      <div className={clientsPageStyles.detailsGrid}>
        {/* Trainer Note */}
        <div>
          <h1 className={clientsPageStyles.trainerNoteTitle}>Trainer Note</h1>
          <textarea
            value={trainerNote}
            onChange={(e) => setTrainerNote(e.target.value)}
            placeholder="Your note will not be visible to the client"
            className={clientsPageStyles.trainerNoteTextarea}
          />
        </div>

        {/* Latest Workout Card */}
        <WorkoutCard clientId={client.id} userId={client.userId} workout={selectedWorkout} />
      </div>
    </div>
    ) : (
      <NoClientSelected />
    )
  )
}