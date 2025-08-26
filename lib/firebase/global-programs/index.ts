import { db } from "@/lib/db"
import { collection, query, doc, getDoc, getDocs, where } from "firebase/firestore"
import { GlobalProgram, GlobalProgramRoutine, GlobalRoutine, ProgramWithRoutines, RoutineWithOrder } from "./types"
import { convertTimestampsToDates, convertTimestampsToISO } from "@/lib/utils/date-utils"


async function getGlobalProgram(id: string): Promise<ProgramWithRoutines | null> {
  const program = await getDoc(doc(db, "global_programs", id))
  if (!program.exists()) {
    return null
  }
  console.log("program", convertTimestampsToDates(program.data()))

  return {
    ...program.data() as GlobalProgram,
    routines: await getGlobalRoutines(program.data()?.routines)
  }
}

async function getGlobalRoutines(globalRoutines: GlobalProgramRoutine[]): Promise<RoutineWithOrder[]> {
  // global routines as a map - these are GlobalProgramRoutine objects with order and week
  const globalRoutinesMap = new Map(globalRoutines.map((routine) => [routine.routineId, routine]))

  const routineIds = globalRoutines.map((routine) => routine.routineId)
  console.log("looking for routineIds", routineIds)
  const q = query(collection(db, "global_routines"), where("id", "in", routineIds))
  const routines = await getDocs(q)
  console.log("routines", routines.docs)
  const routinesData: RoutineWithOrder[] = routines.docs.map((doc) => {
    const globalRoutine = convertTimestampsToISO(doc.data()) as GlobalRoutine
    const programRoutine = globalRoutinesMap.get(doc.id)

    return {
      ...globalRoutine,
      order: programRoutine?.order || 0,
      week: programRoutine?.week || 0
    } as RoutineWithOrder
  })

  return routinesData
}

export { getGlobalProgram }
