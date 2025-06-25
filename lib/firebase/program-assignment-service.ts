import { getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import type { WorkoutProgram, WorkoutRoutine, ProgramExercise } from "@/types/workout-program" // Import necessary types

export const assignProgramToClient = async (trainerId: string, clientId: string, programData: WorkoutProgram) => {
  const firestore = getFirebaseAdminFirestore()
  const batch = firestore.batch()

  try {
    // 1. Create the main program document
    const clientProgramsCollectionRef = firestore
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("programs") // Corrected subcollection name to 'programs'

    const programRef = clientProgramsCollectionRef.doc() // Let Firestore generate a new ID

    const programMetadata = {
      program_title: programData.program_title,
      program_notes: programData.program_notes || null,
      program_weeks: programData.program_weeks,
      routine_count: programData.routines.length,
      is_periodized: programData.is_periodized || false,
      assignedAt: firestore.FieldValue.serverTimestamp(),
      trainerId: trainerId,
      clientId: clientId,
      program_URL: programData.program_URL || null,
    }
    batch.set(programRef, programMetadata)

    // 2. Create routine documents as a subcollection under the program
    for (const routine of programData.routines) {
      const routineRef = programRef.collection("routines").doc() // New routine document
      const routineData: Omit<WorkoutRoutine, "exercises"> = {
        routine_name: routine.routine_name,
        routine_rank: routine.routine_rank,
      }
      batch.set(routineRef, routineData)

      // 3. Create exercise documents as a subcollection under each routine
      for (const exercise of routine.exercises) {
        const exerciseRef = routineRef.collection("exercises").doc() // New exercise document
        const exerciseData: Omit<ProgramExercise, "name"> & { name: string } = {
          name: exercise.name,
          exercise_category: exercise.exercise_category,
          exercise_video: exercise.exercise_video || null,
          notes: exercise.notes || null,
          weeks: exercise.weeks, // The weeks array (with sets) is stored directly in the exercise document
        }
        batch.set(exerciseRef, exerciseData)
      }
    }

    // 4. Update the client's main document to point to the latest assigned program
    const clientRef = firestore.collection("users").doc(trainerId).collection("clients").doc(clientId)
    batch.update(clientRef, {
      currentProgramId: programRef.id,
      currentProgramTitle: programData.program_title,
      programAssignedAt: firestore.FieldValue.serverTimestamp(),
    })

    await batch.commit()

    return { success: true, programId: programRef.id }
  } catch (error: any) {
    console.error("Error assigning program to client:", error)
    return { success: false, error: error }
  }
}

export const unassignProgramFromClient = async (trainerId: string, clientId: string, programId: string) => {
  const firestore = getFirebaseAdminFirestore()
  const batch = firestore.batch()

  try {
    const programRef = firestore
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("programs") // Corrected subcollection name
      .doc(programId)

    // Delete all exercises within each routine
    const routinesSnapshot = await programRef.collection("routines").get()
    for (const routineDoc of routinesSnapshot.docs) {
      const exercisesSnapshot = await routineDoc.ref.collection("exercises").get()
      for (const exerciseDoc of exercisesSnapshot.docs) {
        batch.delete(exerciseDoc.ref)
      }
      // Delete the routine document itself
      batch.delete(routineDoc.ref)
    }

    // Delete the main program document
    batch.delete(programRef)

    // Optionally clear currentProgramId from client's main document
    const clientRef = firestore.collection("users").doc(trainerId).collection("clients").doc(clientId)
    batch.update(clientRef, {
      currentProgramId: firestore.FieldValue.delete(),
      currentProgramTitle: firestore.FieldValue.delete(),
      programAssignedAt: firestore.FieldValue.delete(),
    })

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error("Error unassigning program from client:", error)
    return { success: false, error: error }
  }
}

export const getClientPrograms = async (trainerId: string, clientId: string) => {
  const firestore = getFirebaseAdminFirestore()
  try {
    const programsSnapshot = await firestore
      .collection("users")
      .doc(trainerId)
      .collection("clients")
      .doc(clientId)
      .collection("programs") // Corrected subcollection name
      .orderBy("assignedAt", "desc")
      .get()

    const programs: WorkoutProgram[] = []

    for (const programDoc of programsSnapshot.docs) {
      const programData = programDoc.data() as WorkoutProgram
      const routines: WorkoutRoutine[] = []

      const routinesSnapshot = await programDoc.ref.collection("routines").orderBy("routine_rank").get()
      for (const routineDoc of routinesSnapshot.docs) {
        const routineData = routineDoc.data() as WorkoutRoutine
        const exercises: ProgramExercise[] = []

        const exercisesSnapshot = await routineDoc.ref.collection("exercises").get()
        for (const exerciseDoc of exercisesSnapshot.docs) {
          const exerciseData = exerciseDoc.data() as ProgramExercise
          exercises.push(exerciseData)
        }
        routines.push({ ...routineData, exercises })
      }
      programs.push({ id: programDoc.id, ...programData, routines })
    }

    return { success: true, data: programs }
  } catch (error) {
    console.error("Error getting client programs:", error)
    return { success: false, error: error }
  }
}
