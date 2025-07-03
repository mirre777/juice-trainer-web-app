"use client"

import { useState, useEffect, useRef } from "react"
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { Client } from "@/types/client"

export function useClientDataHybrid(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Demo clients data
  const demoClients = [
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

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Helper function to convert Firestore document to Client
  const convertFirestoreToClient = (doc: any): Client => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || "Unnamed Client",
      initials: getInitials(data.name || "UC"),
      status: data.status || "Active",
      progress: data.progress || 0,
      sessions: data.sessions || { completed: 0, total: 0 },
      completion: data.completion || 0,
      notes: data.notes || "",
      bgColor: data.bgColor || "#f3f4f6",
      textColor: data.textColor || "#111827",
      lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
      metrics: data.metrics || [],
      email: data.email || "",
      goal: data.goal || "",
      program: data.program || "",
      createdAt: data.createdAt?.toDate?.() || new Date(),
      inviteCode: data.inviteCode || "",
      userId: data.userId || "",
      phone: data.phone || "",
    }
  }

  // Step 1: Fetch existing clients via API
  const fetchExistingClients = async () => {
    try {
      console.log("🚀 [Hybrid] Step 1: Fetching existing clients via API...")

      const response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 [Hybrid] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 [Hybrid] API response data:", {
        clientCount: data.clients?.length || 0,
        userId: data.userId,
      })

      if (data.clients && Array.isArray(data.clients)) {
        setClients(data.clients)
        setLastFetchTime(new Date())
        console.log("✅ [Hybrid] Successfully loaded", data.clients.length, "existing clients")
        return data.clients
      } else {
        console.log("⚠️ [Hybrid] No clients in API response")
        setClients([])
        setLastFetchTime(new Date())
        return []
      }
    } catch (err) {
      console.error("❌ [Hybrid] Error fetching existing clients:", err)
      throw err
    }
  }

  // Step 2: Set up real-time listener for new clients
  const setupRealtimeListener = async (userId: string, existingClients: Client[]) => {
    try {
      console.log("🔗 [Hybrid] Step 2: Setting up real-time listener for new clients...")

      // Get the timestamp from when we fetched existing clients
      const fetchTimestamp = lastFetchTime || new Date()

      // Set up listener for clients created after our API fetch
      const clientsRef = collection(db, "users", userId, "clients")
      const newClientsQuery = query(
        clientsRef,
        where("createdAt", ">", Timestamp.fromDate(fetchTimestamp)),
        orderBy("createdAt", "desc"),
      )

      console.log("📍 [Hybrid] Listening for new clients created after:", fetchTimestamp.toISOString())

      const unsubscribe = onSnapshot(
        newClientsQuery,
        (snapshot) => {
          console.log("📊 [Hybrid] Real-time update: received", snapshot.size, "new documents")

          if (snapshot.empty) {
            console.log("ℹ️ [Hybrid] No new clients detected")
            return
          }

          const newClients: Client[] = []

          snapshot.forEach((doc) => {
            const data = doc.data()
            console.log("📄 [Hybrid] Processing new client:", doc.id, data.name)

            // Validate client data and avoid duplicates
            if (data && typeof data === "object" && data.name && !data.name.includes("channel?VER=")) {
              const client = convertFirestoreToClient(doc)

              // Check if client already exists (avoid duplicates)
              const existsInCurrent = existingClients.some((c) => c.id === client.id)
              if (!existsInCurrent) {
                newClients.push(client)
                console.log("✅ [Hybrid] Added new client:", client.name)
              } else {
                console.log("⚠️ [Hybrid] Skipped duplicate client:", client.name)
              }
            }
          })

          if (newClients.length > 0) {
            setClients((prevClients) => {
              // Merge new clients with existing ones, avoiding duplicates
              const mergedClients = [...prevClients]

              newClients.forEach((newClient) => {
                const exists = mergedClients.some((c) => c.id === newClient.id)
                if (!exists) {
                  mergedClients.unshift(newClient) // Add to beginning (newest first)
                }
              })

              console.log("🎯 [Hybrid] Updated clients list:", mergedClients.length, "total clients")
              return mergedClients
            })
          }
        },
        (error) => {
          console.error("❌ [Hybrid] Real-time listener error:", error)
          setError(`Real-time updates failed: ${error.message}`)
        },
      )

      unsubscribeRef.current = unsubscribe
      console.log("✅ [Hybrid] Real-time listener setup complete")
    } catch (err) {
      console.error("❌ [Hybrid] Error setting up real-time listener:", err)
      setError(`Failed to setup live updates: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  useEffect(() => {
    if (isDemo) {
      setClients(demoClients)
      setLoading(false)
      return
    }

    const initializeHybridFetch = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("🎬 [Hybrid] Starting hybrid client fetching...")

        // Step 1: Fetch existing clients via API
        const existingClients = await fetchExistingClients()

        // Step 2: Get current user to set up real-time listener
        const userResponse = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          const userId = userData.uid

          if (userId) {
            // Step 3: Set up real-time listener for new clients
            await setupRealtimeListener(userId, existingClients)
          } else {
            console.warn("⚠️ [Hybrid] No user ID found, skipping real-time listener")
          }
        } else {
          console.warn("⚠️ [Hybrid] Failed to get user data, skipping real-time listener")
        }
      } catch (err) {
        console.error("❌ [Hybrid] Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to load clients")
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    initializeHybridFetch()

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 [Hybrid] Cleaning up real-time listener")
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [isDemo])

  // Manual refetch function (useful for pull-to-refresh)
  const refetch = async () => {
    if (!isDemo) {
      setLoading(true)
      try {
        await fetchExistingClients()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refetch clients")
      } finally {
        setLoading(false)
      }
    }
  }

  return {
    clients,
    loading,
    error,
    refetch,
    lastFetchTime,
  }
}
