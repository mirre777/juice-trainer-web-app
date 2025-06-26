import type React from "react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  notes: string
}

interface Workout {
  id: string
  startedAt?: { seconds: number }
  createdAt?: { seconds: number }
  notes?: string
}

interface ClientCardProps {
  client: Client
  latestWorkout: Workout | null
}

const ClientCard: React.FC<ClientCardProps> = ({ client, latestWorkout }) => {
  const workoutDate = latestWorkout?.startedAt
    ? new Date(latestWorkout.startedAt.seconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : latestWorkout?.createdAt
      ? new Date(latestWorkout.createdAt.seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A"

  const displayNotes = latestWorkout?.notes || client.notes || "No notes available"

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
      <p className="text-gray-600">Email: {client.email}</p>
      <p className="text-gray-600">Phone: {client.phone}</p>
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-700">Last Workout:</p>
        <p className="text-gray-600">{workoutDate}</p>
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-700">NOTES:</p>
        <p className="text-gray-600">{displayNotes}</p>
      </div>
    </div>
  )
}

export default ClientCard
