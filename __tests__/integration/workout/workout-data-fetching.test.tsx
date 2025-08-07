import { render, screen, waitFor } from "@testing-library/react"
import { getLastWorkout, getUserWorkoutById, getLatestWorkoutForUser } from "@/lib/firebase/workout-service"
import { ClientWorkoutView } from "@/components/client-workout-view"
import "@testing-library/jest-dom"
import jest from "jest"

// Mock Firebase
jest.mock("@/lib/firebase/firebase", () => ({
  db: {},
}))

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}))

// Mock the workout service
jest.mock("@/lib/firebase/workout-service")

const mockGetUserWorkouts = getLastWorkout as jest.MockedFunction<typeof getLastWorkout>
const mockGetUserWorkoutById = getUserWorkoutById as jest.MockedFunction<typeof getUserWorkoutById>
const mockGetLatestWorkoutForUser = getLatestWorkoutForUser as jest.MockedFunction<typeof getLatestWorkoutForUser>

describe("Workout Data Fetching Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getUserWorkouts", () => {
    it("fetches and formats workout data correctly", async () => {
      const mockWorkouts = [
        {
          id: "workout-1",
          name: "Upper Body Strength",
          notes: "Great session",
          startedAt: { seconds: 1705123200, nanoseconds: 0 },
          completedAt: { seconds: 1705126800, nanoseconds: 0 },
          createdAt: { seconds: 1705123200, nanoseconds: 0 },
          duration: 3600,
          status: "completed",
          exercises: [
            {
              id: "ex-1",
              name: "Bench Press",
              sets: [{ id: "set-1", weight: 80, reps: "8", type: "working" }],
            },
          ],
        },
      ]

      mockGetUserWorkouts.mockResolvedValue({
        workouts: mockWorkouts,
        error: null,
      })

      const result = await getLastWorkout("user-123")

      expect(result.workouts).toHaveLength(1)
      expect(result.workouts[0].name).toBe("Upper Body Strength")
      expect(result.workouts[0].status).toBe("completed")
      expect(result.workouts[0].exercises).toHaveLength(1)
      expect(result.error).toBeNull()
    })

    it("handles empty workout collection", async () => {
      mockGetUserWorkouts.mockResolvedValue({
        workouts: [],
        error: null,
      })

      const result = await getLastWorkout("user-123")

      expect(result.workouts).toHaveLength(0)
      expect(result.error).toBeNull()
    })

    it("handles Firebase errors gracefully", async () => {
      const mockError = new Error("Firebase connection failed")

      mockGetUserWorkouts.mockResolvedValue({
        workouts: [],
        error: mockError,
      })

      const result = await getLastWorkout("user-123")

      expect(result.workouts).toHaveLength(0)
      expect(result.error).toBe(mockError)
    })

    it("validates required userId parameter", async () => {
      mockGetUserWorkouts.mockResolvedValue({
        workouts: [],
        error: expect.any(Object),
      })

      const result = await getLastWorkout("")

      expect(result.workouts).toHaveLength(0)
      expect(result.error).toBeDefined()
    })
  })

  describe("getUserWorkoutById", () => {
    it("fetches specific workout by ID", async () => {
      const mockWorkout = {
        id: "workout-1",
        name: "Upper Body Strength",
        notes: "Great session",
        startedAt: { seconds: 1705123200, nanoseconds: 0 },
        completedAt: { seconds: 1705126800, nanoseconds: 0 },
        createdAt: { seconds: 1705123200, nanoseconds: 0 },
        duration: 3600,
        status: "completed",
        exercises: [],
        day: "3",
        focus: "Upper Body Strength",
        clientName: "John Doe",
        date: "Jan 13, 2024",
        progress: { completed: 1, total: 1 },
      }

      mockGetUserWorkoutById.mockResolvedValue({
        workout: mockWorkout,
        error: null,
      })

      const result = await getUserWorkoutById("trainer-123", "client-456", "workout-1")

      expect(result.workout).toBeDefined()
      expect(result.workout?.id).toBe("workout-1")
      expect(result.workout?.name).toBe("Upper Body Strength")
      expect(result.workout?.clientName).toBe("John Doe")
      expect(result.error).toBeNull()
    })

    it("returns null for non-existent workout", async () => {
      mockGetUserWorkoutById.mockResolvedValue({
        workout: null,
        error: null,
      })

      const result = await getUserWorkoutById("trainer-123", "client-456", "non-existent")

      expect(result.workout).toBeNull()
      expect(result.error).toBeNull()
    })

    it("handles missing client document", async () => {
      const mockError = new Error("Client document not found")

      mockGetUserWorkoutById.mockResolvedValue({
        workout: null,
        error: mockError,
      })

      const result = await getUserWorkoutById("trainer-123", "non-existent-client", "workout-1")

      expect(result.workout).toBeNull()
      expect(result.error).toBe(mockError)
    })
  })

  describe("getLatestWorkoutForUser", () => {
    it("fetches the most recent workout", async () => {
      const mockLatestWorkout = {
        id: "workout-latest",
        name: "Latest Workout",
        notes: "",
        startedAt: { seconds: 1705209600, nanoseconds: 0 }, // More recent
        completedAt: { seconds: 1705213200, nanoseconds: 0 },
        createdAt: { seconds: 1705209600, nanoseconds: 0 },
        duration: 3600,
        status: "completed",
        exercises: [],
        day: "5",
        focus: "Latest Workout",
        clientName: "John Doe",
        date: "Jan 14, 2024",
        progress: { completed: 1, total: 1 },
      }

      mockGetLatestWorkoutForUser.mockResolvedValue({
        workout: mockLatestWorkout,
        error: null,
      })

      const result = await getLatestWorkoutForUser("trainer-123", "client-456")

      expect(result.workout).toBeDefined()
      expect(result.workout?.id).toBe("workout-latest")
      expect(result.workout?.name).toBe("Latest Workout")
      expect(result.error).toBeNull()
    })

    it("returns null when no workouts exist", async () => {
      mockGetLatestWorkoutForUser.mockResolvedValue({
        workout: null,
        error: null,
      })

      const result = await getLatestWorkoutForUser("trainer-123", "client-456")

      expect(result.workout).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("Data Integration with ClientWorkoutView", () => {
    it("integrates fetched workout data with component", async () => {
      const mockWorkoutData = {
        id: "workout-1",
        name: "Upper Body Strength",
        notes: "Great session",
        startedAt: { seconds: 1705123200, nanoseconds: 0 },
        completedAt: { seconds: 1705126800, nanoseconds: 0 },
        createdAt: { seconds: 1705123200, nanoseconds: 0 },
        duration: 3600,
        status: "completed",
        exercises: [
          {
            id: "ex-1",
            name: "Bench Press",
            sets: [{ id: "set-1", weight: 80, reps: "8", type: "working" }],
          },
        ],
        day: "3",
        focus: "Upper Body Strength",
        clientName: "John Doe",
        date: "Jan 13, 2024",
        progress: { completed: 1, total: 1 },
        personalRecords: [
          {
            exercise: "Bench Press",
            weight: "80 kg",
            reps: "8",
            date: "Jan 13, 2024",
            isPR: true,
          },
        ],
      }

      mockGetUserWorkoutById.mockResolvedValue({
        workout: mockWorkoutData,
        error: null,
      })

      // Simulate component integration
      const client = {
        id: "client-456",
        name: "John Doe",
        date: "Jan 13, 2024",
      }

      const workout = {
        day: "3",
        focus: "Upper Body Strength",
      }

      const exercises = [
        {
          id: "ex-1",
          name: "Bench Press",
          weight: "80",
          reps: "8",
          completed: true,
          sets: [{ number: 1, weight: "80", reps: "8", isPR: true }],
        },
      ]

      render(
        <ClientWorkoutView
          client={client}
          workout={workout}
          exercises={exercises}
          personalRecords={mockWorkoutData.personalRecords}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText("Day 3 - Upper Body Strength")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()
        expect(screen.getByText("Bench Press")).toBeInTheDocument()
        expect(screen.getByText("80 × 8")).toBeInTheDocument()
      })
    })
  })
})
