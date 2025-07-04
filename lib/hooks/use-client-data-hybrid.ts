"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { useAuth } from "@/context/AuthContext"

interface Client {
  id: string
  name: string
  email: string
  status: string
  progress: number
  sessions: { completed: number; total: number }
  lastWorkout: { name: string; date: string }
  goal: string
  initials: string
  bgColor: string
  textColor: string
}

interface UseClientDataReturn {
  clients: Client[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastFetchTime: Date | null
}

export function useClientDataHybrid(): UseClientDataReturn {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const { user } = useAuth()

  console.log("🎬 [Hybrid] Hook initialized, user:", user?.uid || "none")

  // Step 1: Fetch existing clients via API (using cookies like other routes)
  const fetchClientsViaAPI = useCallback(async () => {
    try {
      console.log("🚀 [Hybrid] Step 1: Fetching existing clients via API...")

      // Use the same fetch pattern as your other API calls - cookies are sent automatically
      const response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include", // This ensures cookies are sent
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 [Hybrid] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("❌ [Hybrid] API error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ [Hybrid] API success, clients received:", data.clients?.length || 0)

      setClients(data.clients || [])
      setLastFetchTime(new Date())
      setError(null)
      return data.clients || []
    } catch (err: any) {
      console.error("❌ [Hybrid] Error fetching existing clients:", err)
      setError(err.message || "Failed to fetch clients")
      throw err
    }
  }, [])

  // Step 2: Set up real-time listener for new clients
  const setupRealtimeListener = useCallback(
    (initialClients: Client[]) => {
      if (!user?.uid) {
        console.log("⚠️ [Hybrid] No user ID for real-time listener")
        return () => {}
      }

      console.log("🔗 [Hybrid] Step 2: Setting up real-time listener...")

      const clientsRef = collection(db, "clients")
      const q = query(clientsRef, where("trainerId", "==", user.uid))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log("🔄 [Hybrid] Real-time update received, changes:", snapshot.docChanges().length)

          const updatedClients: Client[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            updatedClients.push({
              id: doc.id,
              name: data.name || "Unknown Client",
              email: data.email || "",
              status: data.status || "Active",
              progress: data.progress || 0,
              sessions: data.sessions || { completed: 0, total: 0 },
              lastWorkout: data.lastWorkout || { name: "", date: "" },
              goal: data.goal || "",
              initials: data.initials || data.name?.substring(0, 2).toUpperCase() || "??",
              bgColor: data.bgColor || "#3B82F6",
              textColor: data.textColor || "#FFFFFF",
              ...data,
            })
          })

          // Only update if there are actual changes
          if (updatedClients.length !== initialClients.length) {
            console.log("📊 [Hybrid] Client count changed:", {
              before: initialClients.length,
              after: updatedClients.length,
            })
            setClients(updatedClients)
            setLastFetchTime(new Date())
          }
        },
        (error) => {
          console.error("❌ [Hybrid] Real-time listener error:", error)
          setError(`Real-time updates failed: ${error.message}`)
        },
      )

      console.log("✅ [Hybrid] Real-time listener established")
      return unsubscribe
    },
    [user?.uid],
  )

  // Initialize hybrid approach
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const initializeHybridApproach = async () => {
      if (!user?.uid) {
        console.log("⏳ [Hybrid] Waiting for user authentication...")
        setLoading(false)
        return
      }

      console.log("🎬 [Hybrid] Starting hybrid client fetching...")
      setLoading(true)
      setError(null)

      try {
        // Step 1: Fetch existing clients
        const initialClients = await fetchClientsViaAPI()

        // Step 2: Set up real-time listener
        unsubscribe = setupRealtimeListener(initialClients)

        console.log("✅ [Hybrid] Initialization complete")
      } catch (err: any) {
        console.error("❌ [Hybrid] Initialization error:", err)
        setError(err.message || "Failed to initialize client data")
      } finally {
        setLoading(false)
      }
    }

    initializeHybridApproach()

    // Cleanup
    return () => {
      if (unsubscribe) {
        console.log("🧹 [Hybrid] Cleaning up real-time listener")
        unsubscribe()
      }
    }
  }, [user?.uid, fetchClientsViaAPI, setupRealtimeListener])

  // Manual refetch function
  const refetch = useCallback(async () => {
    console.log("🔄 [Hybrid] Manual refetch triggered")
    setLoading(true)
    setError(null)

    try {
      await fetchClientsViaAPI()
    } catch (err: any) {
      console.error("❌ [Hybrid] Manual refetch failed:", err)
      setError(err.message || "Failed to refresh clients")
    } finally {
      setLoading(false)
    }
  }, [fetchClientsViaAPI])

  return {
    clients,
    loading,
    error,
    refetch,
    lastFetchTime,
  }
}
