export interface ExerciseHistoryEntry {
  id: string
  date: string
  formattedDate: string // For display (e.g., "Apr 25")
  weight: string
  reps: string | number
  sets: number
  totalVolume: number // weight * reps * sets
  rpe?: number // Rate of Perceived Exertion (optional)
  notes?: string
  isPR?: boolean
  workoutId?: string
}

export interface ExerciseHistory {
  exerciseId: string
  exerciseName: string
  category: string
  entries: ExerciseHistoryEntry[]
  personalRecords: {
    weight: ExerciseHistoryEntry
    reps: ExerciseHistoryEntry
    volume: ExerciseHistoryEntry
  }
  metrics: {
    averageWeight: number
    averageReps: number
    weightProgress: number // Percentage increase from first to last entry
    volumeProgress: number // Percentage increase in total volume
  }
}

// Mock data generator for testing
export function generateMockExerciseHistory(exerciseName: string): ExerciseHistory {
  // Generate dates for the last 6 months
  const today = new Date()
  const entries: ExerciseHistoryEntry[] = []

  // Starting values
  const baseWeight = exerciseName.includes("Squat")
    ? 100
    : exerciseName.includes("Deadlift")
      ? 140
      : exerciseName.includes("Bench")
        ? 80
        : exerciseName.includes("Press")
          ? 50
          : 60

  const baseReps = 8

  // Generate 24 entries (approximately weekly for 6 months)
  for (let i = 0; i < 24; i++) {
    const entryDate = new Date()
    entryDate.setDate(today.getDate() - i * 7) // Weekly entries

    // Add some variation and general improvement over time
    const progressFactor = 1 + (24 - i) * 0.005 // More recent entries have higher weights
    const randomVariation = 0.95 + Math.random() * 0.1 // ±5% random variation

    const weight = Math.round(baseWeight * progressFactor * randomVariation)
    const reps = Math.max(1, Math.round(baseReps + (Math.random() * 4 - 2))) // Variation in reps
    const sets = 3 + (Math.random() > 0.7 ? 1 : 0) // Mostly 3 sets, occasionally 4

    const isPR = Math.random() > 0.8 // 20% chance of being a PR

    entries.push({
      id: `entry-${i}`,
      date: entryDate.toISOString(),
      formattedDate: entryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: `${weight} kg`,
      reps: reps,
      sets: sets,
      totalVolume: weight * reps * sets,
      rpe: Math.round(Math.random() * 3 + 7), // RPE between 7-10
      notes: isPR ? "New personal record!" : Math.random() > 0.7 ? "Felt strong today" : "",
      isPR: isPR,
      workoutId: `workout-${Math.floor(Math.random() * 100)}`,
    })
  }

  // Sort entries by date (newest first)
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Find personal records
  const weightPR = [...entries].sort(
    (a, b) => Number.parseInt(b.weight.split(" ")[0]) - Number.parseInt(a.weight.split(" ")[0]),
  )[0]

  const repsPR = [...entries].sort(
    (a, b) =>
      (typeof b.reps === "number" ? b.reps : Number.parseInt(b.reps as string)) -
      (typeof a.reps === "number" ? a.reps : Number.parseInt(a.reps as string)),
  )[0]

  const volumePR = [...entries].sort((a, b) => b.totalVolume - a.totalVolume)[0]

  // Calculate metrics
  const avgWeight =
    entries.reduce((sum, entry) => sum + Number.parseInt(entry.weight.split(" ")[0]), 0) / entries.length
  const avgReps =
    entries.reduce(
      (sum, entry) => sum + (typeof entry.reps === "number" ? entry.reps : Number.parseInt(entry.reps as string)),
      0,
    ) / entries.length

  const firstWeight = Number.parseInt(entries[entries.length - 1].weight.split(" ")[0])
  const lastWeight = Number.parseInt(entries[0].weight.split(" ")[0])
  const weightProgress = ((lastWeight - firstWeight) / firstWeight) * 100

  const firstVolume = entries[entries.length - 1].totalVolume
  const lastVolume = entries[0].totalVolume
  const volumeProgress = ((lastVolume - firstVolume) / firstVolume) * 100

  return {
    exerciseId: exerciseName.toLowerCase().replace(/\s+/g, "-"),
    exerciseName: exerciseName,
    category:
      exerciseName.includes("Squat") || exerciseName.includes("Deadlift")
        ? "Lower Body"
        : exerciseName.includes("Press") || exerciseName.includes("Bench")
          ? "Upper Body"
          : "Core",
    entries: entries,
    personalRecords: {
      weight: weightPR,
      reps: repsPR,
      volume: volumePR,
    },
    metrics: {
      averageWeight: avgWeight,
      averageReps: avgReps,
      weightProgress: weightProgress,
      volumeProgress: volumeProgress,
    },
  }
}
