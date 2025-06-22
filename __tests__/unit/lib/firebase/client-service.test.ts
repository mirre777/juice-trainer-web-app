import {
  fetchClients,
  subscribeToClients,
  createClient,
  mapClientData,
  isValidClientData,
} from "@/lib/firebase/client-service"
import { onSnapshot } from "firebase/firestore"
import { generateRandomString } from "@/lib/utils/crypto"
import { createError, logError, tryCatch } from "@/lib/utils/error-handler"

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
  onSnapshot: jest.fn(),
  arrayRemove: jest.fn(),
  arrayUnion: jest.fn(),
}))

jest.mock("@/lib/firebase/firebase", () => ({
  db: {},
}))

jest.mock("@/lib/utils/crypto", () => ({
  generateRandomString: jest.fn(),
}))

jest.mock("@/lib/utils/error-handler", () => ({
  ErrorType: {
    API_MISSING_PARAMS: "API_MISSING_PARAMS",
    DB_READ_FAILED: "DB_READ_FAILED",
    DB_WRITE_FAILED: "DB_WRITE_FAILED",
    DB_DELETE_FAILED: "DB_DELETE_FAILED",
    DB_DOCUMENT_NOT_FOUND: "DB_DOCUMENT_NOT_FOUND",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    INVALID_STATE: "INVALID_STATE",
  },
  createError: jest.fn(),
  logError: jest.fn(),
  tryCatch: jest.fn(),
}))

describe("Client Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("isValidClientData", () => {
    it("should return true for valid client data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
      }

      expect(isValidClientData(validData)).toBe(true)
    })

    it("should return false for null or undefined data", () => {
      expect(isValidClientData(null)).toBe(false)
      expect(isValidClientData(undefined)).toBe(false)
    })

    it("should return false for data with corrupted name", () => {
      const corruptedData = {
        name: "channel?VER=8&database=xyz",
        email: "john@example.com",
      }

      expect(isValidClientData(corruptedData)).toBe(false)
    })

    it("should return false for data with non-string name", () => {
      const invalidData = {
        name: 123,
        email: "john@example.com",
      }

      expect(isValidClientData(invalidData)).toBe(false)
    })
  })

  describe("mapClientData", () => {
    it("should map valid client data correctly", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        status: "Active",
      }

      const result = mapClientData("client-id", validData)

      expect(result).toEqual(
        expect.objectContaining({
          id: "client-id",
          name: "John Doe",
          email: "john@example.com",
          status: "Active",
          initials: "JD",
        }),
      )
    })

    it("should return null for invalid client data", () => {
      const invalidData = {
        name: "channel?VER=8&database=xyz",
      }

      const result = mapClientData("client-id", invalidData)

      expect(result).toBeNull()
    })

    it("should handle missing fields with defaults", () => {
      const minimalData = {
        name: "John",
      }

      const result = mapClientData("client-id", minimalData)

      expect(result).toEqual(
        expect.objectContaining({
          id: "client-id",
          name: "John",
          email: "",
          status: "Active",
          initials: "J",
        }),
      )
    })
  })

  describe("fetchClients", () => {
    it("should fetch clients successfully", async () => {
      // Mock the query and snapshot
      const mockSnapshot = {
        size: 2,
        forEach: jest.fn((callback) => {
          callback({
            id: "client1",
            data: () => ({ name: "John Doe", email: "john@example.com" }),
          })
          callback({
            id: "client2",
            data: () => ({ name: "Jane Smith", email: "jane@example.com" }),
          })
        }),
      }

      tryCatch.mockResolvedValue([mockSnapshot, null])

      const result = await fetchClients("trainer-id")

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "client1",
          name: "John Doe",
        }),
      )
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: "client2",
          name: "Jane Smith",
        }),
      )
    })

    it("should handle missing trainer ID", async () => {
      createError.mockReturnValue("error")

      const result = await fetchClients("")

      expect(result).toEqual([])
      expect(createError).toHaveBeenCalled()
      expect(logError).toHaveBeenCalled()
    })

    it("should handle database errors", async () => {
      tryCatch.mockResolvedValue([null, "db-error"])

      const result = await fetchClients("trainer-id")

      expect(result).toEqual([])
    })

    it("should filter out invalid client data", async () => {
      // Mock the query and snapshot with one valid and one invalid client
      const mockSnapshot = {
        size: 2,
        forEach: jest.fn((callback) => {
          callback({
            id: "client1",
            data: () => ({ name: "John Doe", email: "john@example.com" }),
          })
          callback({
            id: "client2",
            data: () => ({ name: "channel?VER=8&database=xyz", email: "invalid@example.com" }),
          })
        }),
      }

      tryCatch.mockResolvedValue([mockSnapshot, null])

      const result = await fetchClients("trainer-id")

      // Only the valid client should be returned
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "client1",
          name: "John Doe",
        }),
      )
    })
  })

  describe("createClient", () => {
    it("should create a client successfully", async () => {
      // Mock the necessary functions
      const mockClientRef = { id: "new-client-id" }
      generateRandomString.mockReturnValue("invite-code")
      tryCatch.mockImplementation((fn) => {
        if (fn.toString().includes("addDoc")) {
          return Promise.resolve([mockClientRef, null])
        }
        return Promise.resolve([null, null])
      })

      const result = await createClient("trainer-id", {
        name: "New Client",
        email: "new@example.com",
      })

      expect(result).toEqual({
        success: true,
        clientId: "new-client-id",
        inviteCode: "invite-code",
      })

      // Check that the necessary functions were called
      expect(generateRandomString).toHaveBeenCalled()
      expect(tryCatch).toHaveBeenCalledTimes(3) // addDoc, updateDoc, setDoc
    })

    it("should handle missing trainer ID or client name", async () => {
      createError.mockReturnValue("error")

      const result = await createClient("", { name: "" })

      expect(result).toEqual({
        success: false,
        error: "error",
      })
      expect(createError).toHaveBeenCalled()
      expect(logError).toHaveBeenCalled()
    })

    it("should handle database errors when creating client", async () => {
      tryCatch.mockResolvedValue([null, "db-error"])

      const result = await createClient("trainer-id", {
        name: "New Client",
      })

      expect(result).toEqual({
        success: false,
        error: "db-error",
      })
    })
  })

  describe("subscribeToClients", () => {
    it("should set up a subscription correctly", () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()

      onSnapshot.mockImplementation((query, onNext, onError) => {
        // Simulate a snapshot
        onNext({
          size: 2,
          forEach: (callback) => {
            callback({
              id: "client1",
              data: () => ({ name: "John Doe" }),
            })
            callback({
              id: "client2",
              data: () => ({ name: "Jane Smith" }),
            })
          },
        })

        return mockUnsubscribe
      })

      const unsubscribe = subscribeToClients("trainer-id", mockCallback)

      // Check that onSnapshot was called
      expect(onSnapshot).toHaveBeenCalled()

      // Check that the callback was called with the clients
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "client1", name: "John Doe" }),
          expect.objectContaining({ id: "client2", name: "Jane Smith" }),
        ]),
      )

      // Check that the unsubscribe function was returned
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it("should handle missing trainer ID", () => {
      const mockCallback = jest.fn()
      createError.mockReturnValue("error")

      subscribeToClients("", mockCallback)

      expect(createError).toHaveBeenCalled()
      expect(logError).toHaveBeenCalled()
      expect(mockCallback).toHaveBeenCalledWith([], "error")
    })

    it("should handle errors in the subscription", () => {
      const mockCallback = jest.fn()
      const mockError = new Error("Subscription error")

      onSnapshot.mockImplementation((query, onNext, onError) => {
        // Simulate an error
        onError(mockError)

        return jest.fn()
      })

      subscribeToClients("trainer-id", mockCallback)

      // Check that createError was called with the error
      expect(createError).toHaveBeenCalled()

      // Check that the callback was called with an empty array and the error
      expect(mockCallback).toHaveBeenCalledWith([], expect.anything())
    })

    it("should filter out invalid client data in the subscription", () => {
      const mockCallback = jest.fn()

      onSnapshot.mockImplementation((query, onNext) => {
        // Simulate a snapshot with one valid and one invalid client
        onNext({
          size: 2,
          forEach: (callback) => {
            callback({
              id: "client1",
              data: () => ({ name: "John Doe" }),
            })
            callback({
              id: "client2",
              data: () => ({ name: "channel?VER=8&database=xyz" }),
            })
          },
        })

        return jest.fn()
      })

      subscribeToClients("trainer-id", mockCallback)

      // Check that the callback was called with only the valid client
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "client1", name: "John Doe" })]),
      )

      // Check that the callback was called with an array of length 1
      expect(mockCallback.mock.calls[0][0]).toHaveLength(1)
    })
  })
})
