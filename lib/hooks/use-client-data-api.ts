"use client"

import { useState, useEffect, useCallback } from "react"
import { UnifiedClientService } from "@/lib/services/unified-client-service"
import type { Client } from "@/types/client"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useClientDataAPI(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

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

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemo) {
        console.log("🎭 [useClientDataAPI] Demo mode - using demo clients")
        setClients(demoClients)
        setLastFetchTime(new Date())
        setLoading(false)
        return
      }

      console.log("🚀 [useClientDataAPI] Fetching clients with unified service")

      // Use unified client service
      const clientResult = await UnifiedClientService.getClients()

      if (clientResult.success && clientResult.clients) {
        console.log(`✅ [useClientDataAPI] Successfully fetched ${clientResult.clients.length} clients`)
        setClients(clientResult.clients)
        setLastFetchTime(new Date())
        setError(null)
      } else {
        console.error("❌ [useClientDataAPI] Failed to fetch clients:", clientResult.error?.message)
        setError(clientResult.error?.message || "Failed to load clients")
        setClients([])
      }
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useClientDataAPI",
        operation: "fetchClients",
        message: "Failed to load clients",
        errorType: ErrorType.DATA_FETCH_ERROR,
      })

      console.error("❌ [useClientDataAPI] Error:", appError)
      setError(appError.message)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const refetch = useCallback(() => {
    console.log("🔄 [useClientDataAPI] Manual refetch requested")
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    refetch,
    lastFetchTime,
  }
}
