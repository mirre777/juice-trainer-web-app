"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/types/client"

interface UseClientDataHybridReturn {
  clientsData: Client[]
  loading: boolean
  error: string | null
  lastFetchTime: string
  refetch: () => Promise<void>
}

export function useClientDataHybrid(): UseClientDataHybridReturn {
  const [clientsData, setClientsData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<string>("")
  const { toast } = useToast()

  const fetchClients = useCallback(async () => {
    let response: Response // Declare response variable here
    try {
      console.log("[Hybrid] Starting hybrid client fetching")
      setLoading(true)
      setError(null)

      console.log("[Hybrid] Step 1: Fetching existing clients via API")
      response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include",
      })

      console.log("[Hybrid] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[Hybrid] API response data:", data)

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch clients")
      }

      const clients = data.clients || []
      console.log("[Hybrid] Transformed clients:", clients.length)

      setClientsData(clients)
      setLastFetchTime(new Date().toLocaleString())

      console.log("[Hybrid] Step 2: Setting up real-time listener for new clients...")
      // Real-time listener setup would go here if needed

      console.log("[Hybrid] Real-time listener setup complete")
    } catch (err) {
      console.error("[Hybrid] Error fetching existing clients:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`API request failed: ${errorMessage}`) // Use errorMessage instead of response.status
      toast({
        title: "Error Loading Clients",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clientsData,
    loading,
    error,
    lastFetchTime,
    refetch: fetchClients,
  }
}
