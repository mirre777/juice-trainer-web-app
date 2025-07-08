import { getFirestore, doc, setDoc, collection, Timestamp, getDoc } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import { clientService } from "./client-service"

const db = getFirestore()

interface ExerciseSet {
  reps: string
  weight: string
  notes: string
}

interface Exercise {
  name: string
  sets: ExerciseSet[]
}

interface Routine {
  name: string
  exercises: Exercise[]
}

interface ProgramData {
  name: string
  program_title?: string
  duration_weeks: number
  routines: Routine[]
}

interface ConvertedProgram {
  id: string
  name: string
  notes: string
  createdAt: Timestamp
  startedAt: Timestamp
  updatedAt: Timestamp
  duration: number
  program_URL: string
  routines: Array<{
    routineId: string
    week: number
    order: number
  }>
}

class ProgramConversionService {
  async sendProgramToClient(clientId: string, programData: ProgramData) {
    try {
      console.log("🔄 Starting program conversion for client:", clientId)

      // Get client data to find the linked user
      const client = await clientService.getClient(clientId)
      if (!client) {
        throw new Error(`Client not found: ${clientId}`)
      }

      if (!client.linkedUserId) {
        throw new Error(`Client ${clientId} is not linked to a user account`)
      }

      const clientUserId = client.linkedUserId
      console.log("📱 Client linked to user:", clientUserId)

      // Create timestamps using Timestamp.now() for immediate timestamp creation
      const now = Timestamp.now()
      console.log("⏰ Created timestamp:", now, "Type:", typeof now)

      // Generate unique IDs
      const programId = uuidv4()
      const routineIds = programData.routines.map(() => uuidv4())

      console.log("🆔 Generated program ID:", programId)
      console.log("🆔 Generated routine IDs:", routineIds)

      // Convert program data to the format expected by mobile app
      const convertedProgram: ConvertedProgram = {
        id: programId,
        name: programData.name || programData.program_title || "Untitled Program",
        notes: "",
        createdAt: now,
        startedAt: now,
        updatedAt: now,
        duration: programData.duration_weeks || 4,
        program_URL: "",
        routines: routineIds.map((routineId, index) => ({
          routineId,
          week: Math.floor(index / 7) + 1, // Distribute routines across weeks
          order: (index % 7) + 1,
        })),
      }

      console.log("📋 Converted program structure:", {
        id: convertedProgram.id,
        name: convertedProgram.name,
        duration: convertedProgram.duration,
        routinesCount: convertedProgram.routines.length,
        createdAtType: typeof convertedProgram.createdAt,
        startedAtType: typeof convertedProgram.startedAt,
        updatedAtType: typeof convertedProgram.updatedAt,
      })

      // Save program to user's programs collection
      const programRef = doc(collection(db, "users", clientUserId, "programs"), programId)

      console.log("💾 Saving program to:", `users/${clientUserId}/programs/${programId}`)
      await setDoc(programRef, convertedProgram)
      console.log("✅ Program saved successfully")

      // Save individual routines
      for (let i = 0; i < programData.routines.length; i++) {
        const routine = programData.routines[i]
        const routineId = routineIds[i]

        const convertedRoutine = {
          id: routineId,
          name: routine.name,
          exercises: routine.exercises.map((exercise, exerciseIndex) => ({
            id: uuidv4(),
            name: exercise.name,
            order: exerciseIndex + 1,
            sets: exercise.sets.map((set, setIndex) => ({
              id: uuidv4(),
              reps: set.reps,
              weight: set.weight,
              notes: set.notes,
              order: setIndex + 1,
              completed: false,
            })),
          })),
          createdAt: now,
          updatedAt: now,
        }

        const routineRef = doc(collection(db, "users", clientUserId, "routines"), routineId)
        console.log(`💾 Saving routine ${i + 1}:`, routine.name)
        await setDoc(routineRef, convertedRoutine)
      }

      console.log("✅ All routines saved successfully")

      return {
        success: true,
        programId,
        clientUserId,
        routineIds,
        message: `Program "${convertedProgram.name}" sent to client successfully`,
      }
    } catch (error) {
      console.error("❌ Error sending program to client:", error)
      throw error
    }
  }

  async getProgramById(userId: string, programId: string) {
    try {
      const programRef = doc(db, "users", userId, "programs", programId)
      const programDoc = await getDoc(programRef)

      if (!programDoc.exists()) {
        return null
      }

      return {
        id: programDoc.id,
        ...programDoc.data(),
      }
    } catch (error) {
      console.error("❌ Error getting program:", error)
      throw error
    }
  }
}

export const programConversionService = new ProgramConversionService()
