"use client"

import { useState, useEffect } from "react"

export interface Client {
  id: string
  name: string
  email?: string
  status?: string
  initials?: string
  progress?: number
  sessions?: { completed: number; total: number }
  completion?: number
  notes?: string
  bgColor?: string
  textColor?: string
  lastWorkout?: { name: string; date: string; completion: number }
  metrics?: Array<{ name: string; value: string; change: string }>
}

export function useClientDataAPI(isDemo = false) {
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
    },
  ]

  useEffect(() => {
    if (isDemo) {
      setClients(demoClients)
      setLoading(false)
      return
    }

    const fetchClientsFromAPI = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("🚀 [useClientDataAPI] Fetching clients from API...")

        const response = await fetch("/api/clients", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("📡 [useClientDataAPI] API response status:", response.status)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        console.log("📊 [useClientDataAPI] API response data:", {
          clientCount: data.clients?.length || 0,
          success: data.success,
        })

        if (data.success && data.clients && Array.isArray(data.clients)) {
          setClients(data.clients)
          console.log("✅ [useClientDataAPI] Successfully set clients:", data.clients.length)
        } else {
          console.log("⚠️ [useClientDataAPI] No clients in response")
          setClients([])
        }
      } catch (err) {
        console.error("❌ [useClientDataAPI] Error fetching clients:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch clients")
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClientsFromAPI()
  }, [isDemo])

  const refetch = async () => {
    if (!isDemo) {
      setLoading(true)
      try {
        const response = await fetch("/api/clients", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        if (data.success && data.clients && Array.isArray(data.clients)) {
          setClients(data.clients)
        } else {
          setClients([])
        }
      } catch (err) {
        console.error("Error refetching clients:", err)
        setError(err instanceof Error ? err.message : "Failed to refetch clients")
      } finally {
        setLoading(false)
      }
    }
  }

  return { clients, loading, error, refetch }
}
