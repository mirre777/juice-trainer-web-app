"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientWorkouts } from "@/components/clients/client-workouts"
import { getClient } from "@/lib/firebase/client-service"
import { getAuthState } from "@/lib/utils/auth-utils"
import type { Client } from "@/types/client"

export default function ClientPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClientData() {
      try {
        console.log("[ClientPage] Starting client fetch for ID:", params.id)

        // Check authentication state with detailed logging
        const authState = getAuthState()
        console.log("[ClientPage] Auth state result:", authState)

        if (!authState.isAuthenticated || !authState.userId) {
          console.error("[ClientPage] Authentication failed:", authState.error)
          setError(authState.error || "Authentication required. Please log in.")
          setLoading(false)

          // Don't auto-redirect, let user choose
          return
        }

        console.log("[ClientPage] Authenticated with userId:", authState.userId)
        console.log("[ClientPage] Fetching client data...")

        // Fetch client data from Firebase
        const clientData = await getClient(authState.userId, params.id as string)
        console.log("[ClientPage] Client data response:", clientData)

        if (!clientData) {
          console.log("[ClientPage] No client data returned")
          setError("Client not found or you don't have permission to view this client.")
          setLoading(false)
          return
        }

        console.log("[ClientPage] Successfully loaded client:", clientData.name)
        setClient(clientData)
        setLoading(false)
      } catch (err) {
        console.error("[ClientPage] Error in fetchClientData:", err)
        setError(`Failed to load client data: ${err instanceof Error ? err.message : "Unknown error"}`)
        setLoading(false)
      }
    }

    if (params.id) {
      fetchClientData()
    } else {
      console.error("[ClientPage] No client ID in params")
      setError("No client ID provided")
      setLoading(false)
    }
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-300"></div>
        <span className="ml-4 text-gray-600">Loading client data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error Loading Client</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/clients")} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()} variant="default">
              Retry
            </Button>
            <Button onClick={() => router.push("/login")} variant="secondary">
              Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-lg font-semibold text-yellow-700">Client Not Found</h2>
          <p className="text-yellow-600 mb-4">The requested client could not be found.</p>
          <Button onClick={() => router.push("/clients")} variant="outline">
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client: {client.name}</h1>
        <div className="flex gap-2">
          <Link href={`/clients/${params.id}/details-v2`}>
            <Button variant="outline">View New Design</Button>
          </Link>
          <Button onClick={() => router.push("/clients")} variant="secondary">
            Back to Clients
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Client Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {client.name || "Not provided"}
              </div>
              <div>
                <span className="font-medium">Email:</span> {client.email || "Not provided"}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${
                    client.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : client.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {client.status || "Unknown"}
                </span>
              </div>
              {client.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {client.phone}
                </div>
              )}
              {client.goal && (
                <div>
                  <span className="font-medium">Goal:</span> {client.goal}
                </div>
              )}
              {client.program && (
                <div>
                  <span className="font-medium">Program:</span> {client.program}
                </div>
              )}
              <div>
                <span className="font-medium">Client ID:</span> {client.id}
              </div>
              {client.userId && (
                <div>
                  <span className="font-medium">User ID:</span> {client.userId}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            {client.notes ? (
              <p className="whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-gray-600 italic">No notes available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Workouts</h2>
        <ClientWorkouts clientId={client.id.toString()} clientName={client.name} />
      </div>
    </div>
  )
}
