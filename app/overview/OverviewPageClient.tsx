"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, TrendingUp, Activity } from "lucide-react"
import { fetchClients } from "@/lib/firebase/client-service"
import { getUserWorkouts } from "@/lib/firebase/workout-service"
import type { Client } from "@/types/client"
import { useRouter } from "next/navigation"

interface OverviewStats {
  totalClients: number
  activeClients: number
  pendingClients: number
  completedWorkouts: number
}

export default function OverviewPageClient() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<OverviewStats>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    completedWorkouts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadOverviewData()
  }, [])

  const loadOverviewData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user ID from cookie
      const userIdCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_id="))
        ?.split("=")[1]

      if (!userIdCookie) {
        router.push("/login")
        return
      }

      console.log("Loading overview data for trainer:", userIdCookie)

      // Fetch clients using the client service
      const clientsData = await fetchClients(userIdCookie)
      console.log("Fetched clients:", clientsData)

      setClients(clientsData)

      // Calculate stats
      const totalClients = clientsData.length
      const activeClients = clientsData.filter((client) => client.status === "Active").length
      const pendingClients = clientsData.filter((client) => client.status === "Pending").length

      // Get workout completion stats
      let completedWorkouts = 0
      for (const client of clientsData) {
        if (client.userId) {
          try {
            const workouts = await getUserWorkouts(client.userId)
            completedWorkouts += workouts.filter((workout) => workout.status === "completed").length
          } catch (workoutError) {
            console.error(`Error fetching workouts for client ${client.id}:`, workoutError)
          }
        }
      }

      setStats({
        totalClients,
        activeClients,
        pendingClients,
        completedWorkouts,
      })
    } catch (error) {
      console.error("Error loading overview data:", error)
      setError(error instanceof Error ? error.message : "Failed to load overview data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={loadOverviewData} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Overview</h1>
          <Button onClick={() => router.push("/clients")}>View All Clients</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeClients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Clients</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingClients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Workouts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedWorkouts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first client.</p>
                <Button onClick={() => router.push("/clients")}>Add Client</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{client.initials}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/clients/${client.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {clients.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => router.push("/clients")}>
                      View All {clients.length} Clients
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
