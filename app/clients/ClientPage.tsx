"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import LoadingSpinner from "@/components/shared/loading-spinner"

interface Client {
  id: string
  name: string
  email: string
  status: string
  progress: number
  sessions: { completed: number; total: number }
  lastWorkout: { name: string; date: string }
  goal: string
  initials: string
  bgColor: string
  textColor: string
}

export default function ClientPage() {
  const { clients, loading, error, refetch, lastFetchTime } = useClientDataHybrid()
  const [showDebug, setShowDebug] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered")
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Loading Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{error}</p>
            <Button onClick={handleRefresh} className="w-full" disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-600">Manage your coaching clients</p>
          {lastFetchTime && (
            <p className="text-sm text-gray-500 mt-1">Last updated: {lastFetchTime.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-lime-400 hover:bg-lime-500 text-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Total Clients:</strong> {clients.length}
              </div>
              <div>
                <strong>Loading:</strong> {loading ? "Yes" : "No"}
              </div>
              <div>
                <strong>Error:</strong> {error || "None"}
              </div>
              <div>
                <strong>Last Updated:</strong> {lastFetchTime?.toLocaleTimeString() || "Never"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">{clients.filter((c) => c.status === "Active").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {clients.length > 0
                    ? Math.round(clients.reduce((acc, c) => acc + c.progress, 0) / clients.length)
                    : 0}
                  %
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-4">You haven't added any clients yet.</p>
            <Button className="bg-lime-400 hover:bg-lime-500 text-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientCard({ client }: { client: Client }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: client.bgColor, color: client.textColor }}
            >
              {client.initials}
            </div>
            <div>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
          </div>
          <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{client.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${client.progress}%` }} />
          </div>
        </div>

        {/* Sessions */}
        <div className="flex justify-between text-sm">
          <span>Sessions</span>
          <span>
            {client.sessions.completed}/{client.sessions.total}
          </span>
        </div>

        {/* Last Workout */}
        {client.lastWorkout.name && (
          <div>
            <p className="text-sm font-medium">Last Workout</p>
            <p className="text-sm text-gray-600">{client.lastWorkout.name}</p>
            <p className="text-xs text-gray-500">{client.lastWorkout.date}</p>
          </div>
        )}

        {/* Goal */}
        {client.goal && (
          <div>
            <p className="text-sm font-medium">Goal</p>
            <p className="text-sm text-gray-600">{client.goal}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
