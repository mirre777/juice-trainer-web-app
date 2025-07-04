"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { UnifiedClientService, type ClientResult } from "@/lib/services/unified-client-service"
import type { Client } from "@/types/client"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useClientDataHybrid(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Demo clients data
  const demoClients: Client[] = [
    {
      id: "demo-1",
      name: "Demo Client",
      initials: "DC",
      status: "Active",
      progress: 75,
      sessions: { completed: 15, total: 20 },
      completion: 75,
      notes: "This is a demo client for testing purposes.",
      bgColor: "#f3f4f6",
      textColor: "#111827",
      lastWorkout: { name: "Demo Workout", date: "1 day ago", completion: 90 },
      metrics: [],
      email: "demo@example.com",
      goal: "Demo goal",
      program: "Demo program",
      createdAt: new Date(),
      inviteCode: "DEMO123",
      userId: "demo-user-1",
      phone: "+1234567890",
    },
  ]

  const handleClientResult = useCallback((result: ClientResult) => {
    if (result.success && result.clients) {
      console.log(`✅ [useClientDataHybrid] Received ${result.clients.length} clients via real-time`)
      setClients(result.clients)
      setLastFetchTime(new Date())
      setError(null)
    } else if (result.error) {
      console.error("❌ [useClientDataHybrid] Real-time error:", result.error.message)
      setError(result.error.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isDemo) {
      console.log("🎭 [useClientDataHybrid] Demo mode")
      setClients(demoClients)
      setLastFetchTime(new Date())
      setLoading(false)
      return
    }

    const setupHybridData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("🚀 [useClientDataHybrid] Setting up hybrid data fetching")

        // Step 1: Initial fetch with unified service
        console.log("📊 [useClientDataHybrid] Initial fetch...")
        const initialResult = await UnifiedClientService.getClients()

        if (initialResult.success && initialResult.clients) {
          console.log(`✅ [useClientDataHybrid] Initial fetch: ${initialResult.clients.length} clients`)
          setClients(initialResult.clients)
          setLastFetchTime(new Date())
          setError(null)
        } else {
          console.error("❌ [useClientDataHybrid] Initial fetch failed:", initialResult.error?.message)
          setError(initialResult.error?.message || "Failed to load clients")
        }

        // Step 2: Set up real-time subscription
        console.log("🔗 [useClientDataHybrid] Setting up real-time subscription...")
        const unsubscribe = UnifiedClientService.subscribeToClients(handleClientResult)
        unsubscribeRef.current = unsubscribe

        setLoading(false)
      } catch (err) {
        const appError = handleClientError(err, {
          component: "useClientDataHybrid",
          operation: "setupHybridData",
          message: "Failed to setup client data",
          errorType: ErrorType.DATA_FETCH_ERROR,
        })

        console.error("❌ [useClientDataHybrid] Setup error:", appError)
        setError(appError.message)
        setClients([])
        setLoading(false)
      }
    }

    setupHybridData()

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 [useClientDataHybrid] Cleaning up real-time subscription")
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [isDemo, handleClientResult])

  const refetch = useCallback(async () => {
    if (isDemo) return

    try {
      setLoading(true)
      setError(null)

      console.log("🔄 [useClientDataHybrid] Manual refetch requested")
      const result = await UnifiedClientService.getClients()

      if (result.success && result.clients) {
        setClients(result.clients)
        setLastFetchTime(new Date())
        setError(null)
      } else {
        setError(result.error?.message || "Failed to refetch clients")
      }
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useClientDataHybrid",
        operation: "refetch",
        message: "Failed to refetch clients",
        errorType: ErrorType.DATA_FETCH_ERROR,
      })

      setError(appError.message)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  return {
    clients,
    loading,
    error,
    refetch,
    lastFetchTime,
  }
}
