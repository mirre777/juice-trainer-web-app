"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClientWorkouts } from "@/components/clients/client-workouts"
import { getClient } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"

export default function ClientPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClientData() {
      try {
        console.log("ClientPage: Fetching client data for ID:", params.id)

        // Get trainer ID directly from cookie
        const trainerId = getCookie("user_id")
        console.log("ClientPage: User ID from cookie:", trainerId)

        if (!trainerId) {
          console.error("ClientPage: No user ID available in cookie")
          setError("Authentication required. Please log in.")
          setLoading(false)
          return
        }

        // Fetch real client data from Firebase
        const clientData = await getClient(trainerId as string, params.id as string)
        console.log("ClientPage: Client data received:", clientData)

        if (!clientData) {
          setError("Client not found")
          setLoading(false)
          return
        }

        setClient(clientData)
        setLoading(false)
      } catch (err) {
        console.error("ClientPage: Error fetching client:", err)
        setError("Failed to load client data. Please try again.")
        setLoading(false)
      }
    }

    if (params.id) {
      fetchClientData()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-300"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Error</h2>
        <p className="text-red-600">{error}</p>
        <Button onClick={() => router.push("/clients")} className="mt-4" variant="outline">
          Back to Clients
        </Button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h2 className="text-lg font-semibold text-yellow-700">Client Not Found</h2>
        <p className="text-yellow-600">The requested client could not be found.</p>
        <Button onClick={() => router.push("/clients")} className="mt-4" variant="outline">
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client: {client.name}</h1>
        <Link href={`/clients/${params.id}/details-v2`}>
          <Button variant="outline">View New Design</Button>
        </Link>
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
                <span className="font-medium">Status:</span> {client.status || "Unknown"}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            {client.notes ? <p>{client.notes}</p> : <p className="text-gray-600">No notes available</p>}
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
