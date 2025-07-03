"use client"

import { useState, useEffect } from "react"
import { getCookie } from "cookies-next"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { Client } from "@/types/client"
import { AppError, ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useClientData(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // Other demo clients...
  ]

  useEffect(() => {
    if (isDemo) {
      setClients(demoClients)
      setLoading(false)
      return
    }

    const fetchClients = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user ID from cookie
        const userId = getCookie("user_id")
        console.log("🔍 [useClientData] Fetching clients for user ID:", userId)

        if (!userId) {
          throw new AppError({
            message: "User not authenticated",
            errorType: ErrorType.AUTH_ERROR,
          })
        }

        // Set up real-time listener for clients
        console.log("🔗 [useClientData] Setting up real-time subscription...")

        // Try the correct path: users/{userId}/clients
        const clientsCollectionRef = collection(db, "users", userId.toString(), "clients")

        console.log("📍 [useClientData] Firestore path:", `users/${userId}/clients`)

        const unsubscribe = onSnapshot(
          clientsCollectionRef,
          (snapshot) => {
            console.log("📊 [useClientData] Snapshot received with", snapshot.size, "documents")

            if (snapshot.empty) {
              console.log("⚠️ [useClientData] No documents found in snapshot")
              setClients([])
              setLoading(false)
              return
            }

            const clientsData: Client[] = []

            snapshot.forEach((doc) => {
              const data = doc.data()
              console.log("📄 [useClientData] Processing document:", doc.id, data)

              // Validate client data
              if (data && typeof data === "object" && data.name && !data.name.includes("channel?VER=")) {
                const client: Client = {
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

                clientsData.push(client)
                console.log("✅ [useClientData] Added client:", client.name)
              } else {
                console.log("❌ [useClientData] Skipped invalid client data:", doc.id, data)
              }
            })

            // Sort by creation date
            clientsData.sort((a, b) => {
              const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0)
              const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0)
              return dateB.getTime() - dateA.getTime()
            })

            console.log("🎯 [useClientData] Final clients array:", clientsData.length, "clients")
            setClients(clientsData)
            setLoading(false)
          },
          (error) => {
            console.error("❌ [useClientData] Firestore subscription error:", error)
            setError(error.message)
            setLoading(false)
          },
        )

        // Cleanup function
        return () => {
          console.log("🧹 [useClientData] Cleaning up subscription")
          unsubscribe()
        }
      } catch (err) {
        const appError = handleClientError(err, {
          component: "useClientData",
          operation: "fetchClients",
          message: "Failed to load clients",
          errorType: ErrorType.DATA_FETCH_ERROR,
        })

        console.error("❌ [useClientData] Error setting up subscription:", appError)
        setError(appError.message)
        setLoading(false)
      }
    }

    const cleanup = fetchClients()

    // Return cleanup function
    return () => {
      if (cleanup && typeof cleanup.then === "function") {
        cleanup.then((cleanupFn) => {
          if (typeof cleanupFn === "function") {
            cleanupFn()
          }
        })
      }
    }
  }, [isDemo])

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return { clients, loading, error }
}
