"use client"

import { useState, useEffect, useCallback } from "react"
import { UnifiedClientService, type ClientResult } from "@/lib/services/unified-client-service"
import type { Client } from "@/types/client"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useClientDataUnified(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Demo clients data
  const demoClients: Client[] = [
    {
      id: "1",
      name: "Salty Snack",
      initials: "SS",
      status: "Active",
      progress: 38,
      sessions: { completed: 12, total: 30 },
      completion: 38,
      notes: "Working on strength training and nutrition plan.",
      bgColor: "#f3f4f6",
      textColor: "#111827",
      lastWorkout: { name: "Upper Body Strength", date: "2 days ago", completion: 85 },
      metrics: [
        { name: "Weight", value: "165 lbs", change: "+2 lbs" },
        { name: "Body Fat", value: "18%", change: "-1.5%" },
        { name: "Squat 1RM", value: "225 lbs", change: "+15 lbs" },
      ],
      email: "salty@example.com",
      goal: "Build muscle and lose fat",
      program: "Strength Training",
      createdAt: new Date(),
      inviteCode: "DEMO123",
      userId: "demo-user-1",
      phone: "+1234567890",
    },
  ]

  const handleClientResult = useCallback((result: ClientResult) => {
    if (result.success && result.clients) {
      console.log(`✅ [useClientDataUnified] Received ${result.clients.length} clients`)
      setClients(result.clients)
      setError(null)
    } else if (result.error) {
      console.error("❌ [useClientDataUnified] Error:", result.error.message)
      setError(result.error.message)
      setClients([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isDemo) {
      console.log("🎭 [useClientDataUnified] Demo mode")
      setClients(demoClients)
      setLoading(false)
      return
    }

    const fetchClients = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("🚀 [useClientDataUnified] Fetching clients with unified service")

        // Use unified client service for initial fetch
        const result = await UnifiedClientService.getClients()
        handleClientResult(result)

        // Set up real-time subscription
        console.log("🔗 [useClientDataUnified] Setting up real-time subscription")
        const unsubscribe = UnifiedClientService.subscribeToClients(handleClientResult)

        return unsubscribe
      } catch (err) {
        const appError = handleClientError(err, {
          component: "useClientDataUnified",
          operation: "fetchClients",
          message: "Failed to load clients",
          errorType: ErrorType.DATA_FETCH_ERROR,
        })

        console.error("❌ [useClientDataUnified] Error:", appError)
        setError(appError.message)
        setClients([])
        setLoading(false)
      }
    }

    const cleanup = fetchClients()

    // Cleanup function
    return () => {
      if (cleanup && typeof cleanup.then === "function") {
        cleanup.then((unsubscribe) => {
          if (typeof unsubscribe === "function") {
            console.log("🧹 [useClientDataUnified] Cleaning up subscription")
            unsubscribe()
          }
        })
      }
    }
  }, [isDemo, handleClientResult])

  const refetch = useCallback(async () => {
    if (isDemo) return

    try {
      setLoading(true)
      setError(null)

      const result = await UnifiedClientService.getClients()
      handleClientResult(result)
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useClientDataUnified",
        operation: "refetch",
        message: "Failed to refetch clients",
        errorType: ErrorType.DATA_FETCH_ERROR,
      })

      setError(appError.message)
      setLoading(false)
    }
  }, [isDemo, handleClientResult])

  return { clients, loading, error, refetch }
}
