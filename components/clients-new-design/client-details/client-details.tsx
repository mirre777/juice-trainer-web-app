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
}

export function ClientDetails({ clientId, trainerInviteCode, onClientDeleted, onClientUpdated }: ClientDetailsProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [workouts, setWorkouts] = useState<FirebaseWorkout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<FirebaseWorkout | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setClient(null)
        return
      }
      const [client, workouts] = await Promise.all([fetchClientInfo(), fetchWorkouts()])
      if (client) {
        setClient(client)
      }
      if (workouts) {
        setWorkouts(workouts)
        setSelectedWorkout(getLatestWorkout(workouts) || null)
      }
    }
    fetchClientData()
  }, [clientId])

  const fetchClientInfo = async () => {
    const clientResponse = await fetch(`/api/clients/${clientId}`)
    return await clientResponse.json() as Client
  }

  const fetchWorkouts = async () => {
    const workoutsResponse = await fetch(`/api/clients/${clientId}/workouts`)
    const { workouts: fetchedWorkouts } = await workoutsResponse.json()
    return fetchedWorkouts as FirebaseWorkout[]
  }

  const getLatestWorkout = (workouts: FirebaseWorkout[]): FirebaseWorkout | null => {
    return workouts.sort((a, b) => new Date(b.completedAt ?? new Date()).getTime() - new Date(a.completedAt ?? new Date()).getTime())[0] || null
  }

  const handleWorkoutSelect = (workout: FirebaseWorkout | null) => {
    setSelectedWorkout(workout)
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
        handleWorkoutSelect={handleWorkoutSelect}
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