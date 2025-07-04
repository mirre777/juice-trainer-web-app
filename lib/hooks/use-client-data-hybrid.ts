"use client"

import { useState, useEffect, useCallback } from "react"
import { subscribeToClients } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"
import type { Client } from "@/types/client"

interface UseClientDataHybridReturn {
  clients: Client[]
  loading: boolean
  error: string | null
  refetch: () => void
  lastFetchTime: Date | null
}

export function useClientDataHybrid(isDemo = false): UseClientDataHybridReturn {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

  console.log("[Hybrid] Starting hybrid client fetching, isDemo:", isDemo)

  // Step 1: Fetch existing clients via API
  const fetchExistingClients = useCallback(async () => {
    console.log("[Hybrid] Step 1: Fetching existing clients via API")

    try {
      const response = await fetch("/api/clients")
      console.log("[Hybrid] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API returned ${response.status}`)
      }

      const data = await response.json()
      console.log("[Hybrid] API response data:", {
        success: data.success,
        clientCount: data.clientCount,
        totalClients: data.totalClients,
      })

      if (data.success && data.clients) {
        console.log("[Hybrid] Transformed clients:", data.clients.length)
        setClients(data.clients)
        setLastFetchTime(new Date())
        setError(null)
      } else {
        throw new Error(data.error || "Failed to fetch clients")
      }
    } catch (err) {
      console.error("[Hybrid] Error fetching existing clients:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch clients")
    }
  }, [])

  // Step 2: Set up real-time listener for new clients
  const setupRealtimeListener = useCallback(() => {
    if (isDemo) return () => {}

    const userId = getCookie("user_id") || getCookie("userId")
    if (!userId) {
      console.log("[Hybrid] No user ID for real-time listener")
      return () => {}
    }

    console.log("[Hybrid] Step 2: Setting up real-time listener for new clients...")

    const unsubscribe = subscribeToClients(userId as string, (updatedClients, error) => {
      if (error) {
        console.error("[Hybrid] Real-time listener error:", error)
        return
      }

      console.log(`[Hybrid] Real-time update: ${updatedClients.length} clients`)
      setClients(updatedClients)
      setLastFetchTime(new Date())
    })

    console.log("[Hybrid] Real-time listener setup complete")
    return unsubscribe
  }, [isDemo])

  // Initialize data fetching
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeData = async () => {
      setLoading(true)

      // Step 1: Fetch existing data
      await fetchExistingClients()

      // Step 2: Set up real-time listener
      unsubscribe = setupRealtimeListener()

      setLoading(false)
    }

    initializeData()

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log("[Hybrid] Cleaning up real-time listener")
        unsubscribe()
      }
    }
  }, [fetchExistingClients, setupRealtimeListener])

  const refetch = useCallback(() => {
    console.log("[Hybrid] Manual refetch requested")
    fetchExistingClients()
  }, [fetchExistingClients])

  return {
    clients,
    loading,
    error,
    refetch,
    lastFetchTime,
  }
}
