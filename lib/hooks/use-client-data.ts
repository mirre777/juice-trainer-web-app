"use client"

import { useState, useEffect } from "react"
import { getCookie } from "cookies-next"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
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
        console.log("Fetching clients for user ID:", userId)

        if (!userId) {
          throw new AppError({
            message: "User not authenticated",
            errorType: ErrorType.AUTH_ERROR,
          })
        }

        // Try both paths - first users path
        const clientsData: Client[] = []
        let foundClients = false

        try {
          // Get clients from the users subcollection
          const usersClientsRef = collection(db, "users", userId.toString(), "clients")
          const usersQuery = query(usersClientsRef, orderBy("createdAt", "desc"))
          const usersSnapshot = await getDocs(usersQuery)

          console.log("Clients found in users path:", usersSnapshot.size)

          if (!usersSnapshot.empty) {
            foundClients = true

            // Map the documents to client objects
            usersSnapshot.docs.forEach((doc) => {
              const data = doc.data()
              clientsData.push({
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
              } as Client)
            })
          }
        } catch (usersError) {
          console.error("Error fetching clients from users path:", usersError)
        }

        // Then try trainers path
        try {
          // Get clients from the trainers subcollection
          const trainersClientsRef = collection(db, "trainers", userId.toString(), "clients")
          const trainersQuery = query(trainersClientsRef, orderBy("createdAt", "desc"))
          const trainersSnapshot = await getDocs(trainersQuery)

          console.log("Clients found in trainers path:", trainersSnapshot.size)

          if (!trainersSnapshot.empty) {
            foundClients = true

            // Map the documents to client objects
            trainersSnapshot.docs.forEach((doc) => {
              const data = doc.data()
              clientsData.push({
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
              } as Client)
            })
          }
        } catch (trainersError) {
          console.error("Error fetching clients from trainers path:", trainersError)
        }

        setClients(clientsData)
      } catch (err) {
        const appError = handleClientError(err, {
          component: "useClientData",
          operation: "fetchClients",
          message: "Failed to load clients",
          errorType: ErrorType.DATA_FETCH_ERROR,
        })

        console.error("Error fetching clients:", appError)
        setError(appError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
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
