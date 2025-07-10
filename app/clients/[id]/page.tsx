"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { getAuthState } from "@/lib/utils/auth-utils"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
  lastWorkout?: string
  totalWorkouts: number
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        console.log("[ClientDetails] Fetching client:", clientId)

        // Check authentication first
        const authState = getAuthState()
        if (!authState.isAuthenticated) {
          console.error("[ClientDetails] Not authenticated:", authState.error)
          setError("Authentication required. Please log in.")
          setLoading(false)
          return
        }

        console.log("[ClientDetails] Authenticated as:", authState.userId)

        // Fetch client data
        const response = await fetch(`/api/clients/${clientId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("[ClientDetails] API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.text()
          console.error("[ClientDetails] API error:", errorData)
          throw new Error(`Failed to fetch client: ${response.status}`)
        }

        const clientData = await response.json()
        console.log("[ClientDetails] Client data received:", clientData)

        setClient(clientData)
      } catch (err) {
        console.error("[ClientDetails] Error fetching client:", err)
        setError(err instanceof Error ? err.message : "Failed to load client")
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const handleGoBack = () => {
    router.push("/clients")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CCFF00]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error Loading Client</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleGoBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Client not found</p>
            <Button onClick={handleGoBack} className="mt-4 bg-transparent" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button onClick={handleGoBack} variant="outline" className="mb-4 bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>

        <h1 className="text-3xl font-bold">{client.name}</h1>
        <p className="text-gray-600">{client.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{client.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p>{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p>{client.phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="capitalize">{client.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p>{new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workout Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Total Workouts</label>
              <p className="text-2xl font-bold">{client.totalWorkouts}</p>
            </div>
            {client.lastWorkout && (
              <div>
                <label className="text-sm font-medium text-gray-500">Last Workout</label>
                <p>{new Date(client.lastWorkout).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
