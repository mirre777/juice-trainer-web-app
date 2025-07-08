export interface Exercise {
  id: string
  name: string
  category: string
  sets: number
  reps: string
  weight?: string
  notes?: string
  restTime?: string
  tempo?: string
  rpe?: number
}

export interface Routine {
  id: string
  name: string
  exercises: Exercise[]
  notes?: string
  estimatedDuration?: number
}

export interface Week {
  id: string
  weekNumber: number
  routines: Routine[]
  notes?: string
}

export interface WorkoutProgram {
  id: string
  name: string
  description?: string
  weeks: Week[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  clientId?: string
  isTemplate: boolean
  tags?: string[]
  difficulty?: "beginner" | "intermediate" | "advanced"
  duration?: number // in weeks
  goals?: string[]
}

export interface ProgramTemplate {
  id: string
  name: string
  description: string
  weeks: Week[]
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  goals: string[]
  createdBy: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ExerciseCategory {
  id: string
  name: string
  description?: string
  muscleGroups: string[]
}

export const DEFAULT_EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    id: "chest",
    name: "Chest",
    description: "Chest exercises",
    muscleGroups: ["pectorals", "anterior deltoids", "triceps"],
  },
  {
    id: "back",
    name: "Back",
    description: "Back exercises",
    muscleGroups: ["latissimus dorsi", "rhomboids", "middle trapezius", "rear deltoids", "biceps"],
  },
  {
    id: "shoulders",
    name: "Shoulders",
    description: "Shoulder exercises",
    muscleGroups: ["anterior deltoids", "medial deltoids", "posterior deltoids", "trapezius"],
  },
  {
    id: "arms",
    name: "Arms",
    description: "Arm exercises",
    muscleGroups: ["biceps", "triceps", "forearms"],
  },
  {
    id: "legs",
    name: "Legs",
    description: "Leg exercises",
    muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves"],
  },
  {
    id: "core",
    name: "Core",
    description: "Core and abdominal exercises",
    muscleGroups: ["rectus abdominis", "obliques", "transverse abdominis", "erector spinae"],
  },
  {
    id: "cardio",
    name: "Cardio",
    description: "Cardiovascular exercises",
    muscleGroups: ["cardiovascular system"],
  },
  {
    id: "functional",
    name: "Functional",
    description: "Functional movement exercises",
    muscleGroups: ["full body", "stabilizers"],
  },
  {
    id: "olympic",
    name: "Olympic Lifts",
    description: "Olympic weightlifting exercises",
    muscleGroups: ["full body", "power development"],
  },
  {
    id: "powerlifting",
    name: "Powerlifting",
    description: "Powerlifting exercises",
    muscleGroups: ["squat", "bench", "deadlift"],
  },
]

export interface ExerciseLibrary {
  [category: string]: {
    name: string
    exercises: string[]
  }
}

export const DEFAULT_EXERCISE_LIBRARY: ExerciseLibrary = {
  chest: {
    name: "Chest",
    exercises: [
      "Barbell Bench Press",
      "Dumbbell Bench Press",
      "Incline Barbell Press",
      "Incline Dumbbell Press",
      "Decline Barbell Press",
      "Decline Dumbbell Press",
      "Dumbbell Flyes",
      "Cable Flyes",
      "Push-ups",
      "Dips",
      "Chest Press Machine",
      "Pec Deck",
    ],
  },
  back: {
    name: "Back",
    exercises: [
      "Deadlift",
      "Pull-ups",
      "Chin-ups",
      "Barbell Rows",
      "Dumbbell Rows",
      "T-Bar Rows",
      "Cable Rows",
      "Lat Pulldowns",
      "Face Pulls",
      "Shrugs",
      "Hyperextensions",
      "Good Mornings",
    ],
  },
  shoulders: {
    name: "Shoulders",
    exercises: [
      "Overhead Press",
      "Dumbbell Shoulder Press",
      "Arnold Press",
      "Lateral Raises",
      "Front Raises",
      "Rear Delt Flyes",
      "Upright Rows",
      "Pike Push-ups",
      "Handstand Push-ups",
      "Cable Lateral Raises",
      "Machine Shoulder Press",
    ],
  },
  arms: {
    name: "Arms",
    exercises: [
      "Barbell Curls",
      "Dumbbell Curls",
      "Hammer Curls",
      "Preacher Curls",
      "Cable Curls",
      "Close-Grip Bench Press",
      "Tricep Dips",
      "Overhead Tricep Extension",
      "Tricep Pushdowns",
      "Diamond Push-ups",
      "Skull Crushers",
    ],
  },
  legs: {
    name: "Legs",
    exercises: [
      "Squats",
      "Front Squats",
      "Leg Press",
      "Romanian Deadlifts",
      "Stiff Leg Deadlifts",
      "Lunges",
      "Bulgarian Split Squats",
      "Leg Curls",
      "Leg Extensions",
      "Calf Raises",
      "Hip Thrusts",
      "Glute Bridges",
    ],
  },
  core: {
    name: "Core",
    exercises: [
      "Plank",
      "Side Plank",
      "Crunches",
      "Bicycle Crunches",
      "Russian Twists",
      "Mountain Climbers",
      "Dead Bug",
      "Bird Dog",
      "Hanging Leg Raises",
      "Ab Wheel Rollouts",
      "Hollow Body Hold",
    ],
  },
}

export type ProgramStatus = "draft" | "active" | "completed" | "paused"

export interface ProgramProgress {
  programId: string
  clientId: string
  currentWeek: number
  currentRoutine: number
  completedWorkouts: string[]
  status: ProgramStatus
  startDate: Date
  endDate?: Date
  notes?: string
  lastUpdated: Date
}

export interface WorkoutSession {
  id: string
  programId: string
  routineId: string
  clientId: string
  date: Date
  exercises: CompletedExercise[]
  duration?: number
  notes?: string
  rating?: number
  status: "planned" | "in_progress" | "completed" | "skipped"
  createdAt: Date
  updatedAt: Date
}

export interface CompletedExercise {
  exerciseId: string
  name: string
  sets: CompletedSet[]
  notes?: string
  personalRecord?: boolean
}

export interface CompletedSet {
  setNumber: number
  reps: number
  weight?: number
  rpe?: number
  restTime?: number
  completed: boolean
  notes?: string
}

export interface PersonalRecord {
  id: string
  clientId: string
  exerciseName: string
  type: "1RM" | "volume" | "endurance"
  value: number
  unit: "lbs" | "kg" | "reps" | "time"
  date: Date
  workoutSessionId?: string
  notes?: string
}
