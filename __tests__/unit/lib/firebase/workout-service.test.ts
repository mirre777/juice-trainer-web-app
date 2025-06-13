import {
  getUserWorkouts,
  getUserWorkoutById,
  getLatestWorkoutForUser,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from "@/lib/firebase/workout-service"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore"
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
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 1705123200, nanoseconds: 0 })),
}))

// Mock error handler
jest.mock("@/lib/utils/error-handler", () => ({
  ErrorType: {
    API_MISSING_PARAMS: "API_MISSING_PARAMS",
    DB_READ_FAILED: "DB_READ_FAILED",
    DB_WRITE_FAILED: "DB_WRITE_FAILED",
    DB_DELETE_FAILED: "DB_DELETE_FAILED",
    DB_DOCUMENT_NOT_FOUND: "DB_DOCUMENT_NOT_FOUND",
    DB_FIELD_MISSING: "DB_FIELD_MISSING",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
  },
  createError: jest.fn((type, error, context, message) => ({ type, error, context, message })),
  logError: jest.fn(),
  tryCatch: jest.fn(async (fn) => {
    try {
      const result = await fn()
      return [result, null]
    } catch (error) {
      return [null, error]
    }
  }),
}))

const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>
const mockLimit = limit as jest.MockedFunction<typeof limit>

describe("Workout Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getUserWorkouts", () => {
    it("fetches workouts successfully", async () => {
      const mockWorkoutData = {
        id: "workout-1",
        name: "Upper Body Strength",
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
      }

      const mockSnapshot = {
        docs: [
          {
            id: "workout-1",
            data: () => mockWorkoutData,
          },
        ],
      }

      mockCollection.mockReturnValue({} as any)
      mockGetDocs.mockResolvedValue(mockSnapshot as any)

      const result = await getUserWorkouts("user-123")

      expect(result.workouts).toHaveLength(1)
      expect(result.workouts[0].id).toBe("workout-1")
      expect(result.workouts[0].name).toBe("Upper Body Strength")
      expect(result.workouts[0].status).toBe("completed")
      expect(result.error).toBeNull()
    })

    it("handles empty userId", async () => {
      const result = await getUserWorkouts("")

      expect(result.workouts).toHaveLength(0)
      expect(result.error).toBeDefined()
    })

    it("handles Firebase errors", async () => {
      mockCollection.mockReturnValue({} as any)
      mockGetDocs.mockRejectedValue(new Error("Firebase error"))

      const result = await getUserWorkouts("user-123")

      expect(result.workouts).toHaveLength(0)
      expect(result.error).toBeDefined()
    })

    it("formats workout data correctly", async () => {
      const mockWorkoutData = {
        name: "Test Workout",
        startedAt: { seconds: 1705123200, nanoseconds: 0 },
        status: "completed",
        exercises: [
          {
            name: "Bench Press",
            sets: [{ weight: 80, reps: "8" }],
          },
        ],
      }

      const mockSnapshot = {
        docs: [
          {
            id: "workout-1",
            data: () => mockWorkoutData,
          },
        ],
      }

      mockCollection.mockReturnValue({} as any)
      mockGetDocs.mockResolvedValue(mockSnapshot as any)

      const result = await getUserWorkouts("user-123")

      expect(result.workouts[0].focus).toBe("Test Workout")
      expect(result.workouts[0].personalRecords).toBeDefined()
      expect(result.workouts[0].personalRecords[0].exercise).toBe("Bench Press")
      expect(result.workouts[0].personalRecords[0].weight).toBe("80 kg")
    })
  })

  describe("getUserWorkoutById", () => {
    it("fetches specific workout successfully", async () => {
      const mockClientData = {
        name: "John Doe",
        userId: "user-123",
      }

      const mockWorkoutData = {
        name: "Upper Body Strength",
        startedAt: { seconds: 1705123200, nanoseconds: 0 },
        status: "completed",
        exercises: [],
      }

      const mockClientDoc = {
        exists: () => true,
        data: () => mockClientData,
      }

      const mockWorkoutDoc = {
        exists: () => true,
        id: "workout-1",
        data: () => mockWorkoutData,
      }

      mockDoc.mockReturnValue({} as any)
      mockGetDoc
        .mockResolvedValueOnce(mockClientDoc as any) // Client doc
        .mockResolvedValueOnce(mockWorkoutDoc as any) // Workout doc

      const result = await getUserWorkoutById("trainer-123", "client-456", "workout-1")

      expect(result.workout).toBeDefined()
      expect(result.workout?.id).toBe("workout-1")
      expect(result.workout?.name).toBe("Upper Body Strength")
      expect(result.workout?.clientName).toBe("John Doe")
      expect(result.error).toBeNull()
    })

    it("handles missing client document", async () => {
      const mockClientDoc = {
        exists: () => false,
      }

      mockDoc.mockReturnValue({} as any)
      mockGetDoc.mockResolvedValue(mockClientDoc as any)

      const result = await getUserWorkoutById("trainer-123", "client-456", "workout-1")

      expect(result.workout).toBeNull()
      expect(result.error).toBeDefined()
    })

    it("handles missing workout document", async () => {
      const mockClientData = {
        name: "John Doe",
        userId: "user-123",
      }

      const mockClientDoc = {
        exists: () => true,
        data: () => mockClientData,
      }

      const mockWorkoutDoc = {
        exists: () => false,
      }

      mockDoc.mockReturnValue({} as any)
      mockGetDoc.mockResolvedValueOnce(mockClientDoc as any).mockResolvedValueOnce(mockWorkoutDoc as any)

      const result = await getUserWorkoutById("trainer-123", "client-456", "workout-1")

      expect(result.workout).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("getLatestWorkoutForUser", () => {
    it("fetches latest workout successfully", async () => {
      const mockClientData = {
        name: "John Doe",
        userId: "user-123",
      }

      const mockWorkoutData = {
        name: "Latest Workout",
        startedAt: { seconds: 1705209600, nanoseconds: 0 },
        status: "completed",
        exercises: [],
      }

      const mockClientDoc = {
        exists: () => true,
        data: () => mockClientData,
      }

      const mockWorkoutSnapshot = {
        empty: false,
        docs: [
          {
            id: "workout-latest",
            data: () => mockWorkoutData,
          },
        ],
      }

      mockDoc.mockReturnValue({} as any)
      mockCollection.mockReturnValue({} as any)
      mockQuery.mockReturnValue({} as any)
      mockOrderBy.mockReturnValue({} as any)
      mockLimit.mockReturnValue({} as any)
      mockGetDoc.mockResolvedValue(mockClientDoc as any)
      mockGetDocs.mockResolvedValue(mockWorkoutSnapshot as any)

      const result = await getLatestWorkoutForUser("trainer-123", "client-456")

      expect(result.workout).toBeDefined()
      expect(result.workout?.id).toBe("workout-latest")
      expect(result.workout?.name).toBe("Latest Workout")
      expect(result.error).toBeNull()
    })

    it("handles empty workout collection", async () => {
      const mockClientData = {
        name: "John Doe",
        userId: "user-123",
      }

      const mockClientDoc = {
        exists: () => true,
        data: () => mockClientData,
      }

      const mockWorkoutSnapshot = {
        empty: true,
        docs: [],
      }

      mockDoc.mockReturnValue({} as any)
      mockCollection.mockReturnValue({} as any)
      mockQuery.mockReturnValue({} as any)
      mockGetDoc.mockResolvedValue(mockClientDoc as any)
      mockGetDocs.mockResolvedValue(mockWorkoutSnapshot as any)

      const result = await getLatestWorkoutForUser("trainer-123", "client-456")

      expect(result.workout).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("createWorkout", () => {
    it("creates workout successfully", async () => {
      const mockWorkoutRef = {
        id: "new-workout-id",
      }

      mockCollection.mockReturnValue({} as any)
      mockAddDoc.mockResolvedValue(mockWorkoutRef as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      const workoutData = {
        name: "New Workout",
        description: "Test workout",
      }

      const result = await createWorkout("trainer-123", "client-456", workoutData)

      expect(result.success).toBe(true)
      expect(result.workoutId).toBe("new-workout-id")
      expect(result.error).toBeUndefined()
    })

    it("handles missing required fields", async () => {
      const result = await createWorkout("trainer-123", "client-456", {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe("updateWorkout", () => {
    it("updates workout successfully", async () => {
      mockDoc.mockReturnValue({} as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      const updates = {
        name: "Updated Workout",
        status: "completed",
      }

      const result = await updateWorkout("trainer-123", "client-456", "workout-1", updates)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("handles missing parameters", async () => {
      const result = await updateWorkout("", "", "", {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe("deleteWorkout", () => {
    it("deletes workout successfully", async () => {
      mockDoc.mockReturnValue({} as any)
      mockDeleteDoc.mockResolvedValue(undefined)

      const result = await deleteWorkout("trainer-123", "client-456", "workout-1")

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("handles missing parameters", async () => {
      const result = await deleteWorkout("", "", "")

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
