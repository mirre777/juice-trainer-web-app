"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { UnifiedClientService, type ClientResult } from "@/lib/services/unified-client-service"
import type { Client } from "@/types/client"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useClientData(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      console.log(`✅ [useClientData] Received ${result.clients.length} clients`)
      setClients(result.clients)
      setError(null)
    } else if (result.error) {
      console.error("❌ [useClientData] Error:", result.error.message)
      setError(result.error.message)
      setClients([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isDemo) {
      console.log("🎭 [useClientData] Demo mode")
      setClients(demoClients)
      setLoading(false)
      return
    }

    console.log("🔗 [useClientData] Setting up real-time client subscription")

    // Set up real-time subscription using unified service
    const unsubscribe = UnifiedClientService.subscribeToClients(handleClientResult)
    unsubscribeRef.current = unsubscribe

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 [useClientData] Cleaning up subscription")
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

      console.log("🔄 [useClientData] Manual refetch requested")
      const result = await UnifiedClientService.getClients()
      handleClientResult(result)
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useClientData",
        operation: "refetch",
        message: "Failed to refetch clients",
        errorType: ErrorType.DATA_FETCH_ERROR,
      })

      setError(appError.message)
      setLoading(false)
    }
  }, [isDemo, handleClientResult])

  return {
    clients,
    loading,
    error,
    refetch,
  }
}
