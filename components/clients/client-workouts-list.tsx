import type React from "react"
import { Button } from "@/components/ui/button"

interface ClientWorkoutsListProps {
  workouts: any[] // Replace 'any' with a more specific type if possible
}

const ClientWorkoutsList: React.FC<ClientWorkoutsListProps> = ({ workouts }) => {
  return (
    <div>
      {workouts.length > 0 ? (
        <ul>
          {workouts.map((workout) => (
            <li key={workout.id}>{workout.name}</li>
          ))}
        </ul>
      ) : (
        <p>No workouts assigned to this client yet.</p>
      )}
      <Button className="text-white bg-black hover:bg-gray-800">Assign Workout</Button>
    </div>
  )
}

export default ClientWorkoutsList
