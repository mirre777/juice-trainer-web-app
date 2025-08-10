"use client"

import { useEffect, useState } from "react"
import { Client } from "@/types/client"
import { clientsPageStyles } from "../../../app/clients-new-design/styles"
import { ClientDetailsHeader } from "./client-details-header"
import { NoClientSelected } from "./no-client-selected"
import { FirebaseWorkout } from "@/lib/firebase/workout-service"

interface ClientDetailsProps {
  clientId: string | null
}

export function ClientDetails({ clientId }: ClientDetailsProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [workouts, setWorkouts] = useState<FirebaseWorkout[]>([])

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
      console.log("workouts", workouts)
      if (workouts) {
        setWorkouts(workouts)
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

  const [trainerNote, setTrainerNote] = useState(client?.notes || "")

  return (
    client ? (
    <div className={clientsPageStyles.detailsContent}>
      {/* Client Header */}
      <ClientDetailsHeader client={client} workouts={workouts} />

      <div className={clientsPageStyles.detailsGrid}>
        {/* Trainer Note */}
        <div className={clientsPageStyles.trainerNoteCard}>
          <h2 className={clientsPageStyles.trainerNoteTitle}>Trainer Note</h2>
          <textarea
            value={trainerNote}
            onChange={(e) => setTrainerNote(e.target.value)}
            placeholder="Your note will not be visible to the client"
            className={clientsPageStyles.trainerNoteTextarea}
          />
        </div>
      </div>
    </div>
    ) : (
      <NoClientSelected />
    )
  )
}