"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, MoreHorizontal, Users, TrendingUp, Calendar, Target } from "lucide-react"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientQuickViewModal } from "@/components/clients/client-quick-view-modal"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { getCurrentUserFromAPI } from "@/lib/services/client-user-service"
import { AuthDebug } from "@/components/debug/auth-debug"
import type { Client } from "@/types/client"

export default function ClientPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Use hybrid approach: API + real-time listener
  const { clients, loading, error, refetch, lastFetchTime } = useClientDataHybrid()

  // Get current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log("[ClientPage] Getting current user from API...")
        const user = await getCurrentUserFromAPI()
        console.log("[ClientPage] Current user result:", {
          exists: !!user,
          uid: user?.uid,
          email: user?.email,
        })
        setCurrentUser(user)
      } catch (error) {
        console.error("[ClientPage] Error getting current user:", error)
      }
    }

    fetchCurrentUser()
  }, [])

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get unique statuses for filter
  const statuses = ["All", ...Array.from(new Set(clients.map((client) => client.status)))]

  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    setShowQuickView(true)
  }

  const handleAddClient = () => {
    setShowAddModal(true)
  }

  const handleClientAdded = () => {
    // The real-time listener will automatically pick up new clients
    console.log("✅ [ClientPage] Client added - real-time listener will update automatically")
  }

  // Calculate stats
  const activeClients = clients.filter((c) => c.status === "Active").length
  const totalSessions = clients.reduce((sum, c) => sum + (c.sessions?.completed || 0), 0)
  const avgCompletion =
    clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + (c.completion || 0), 0) / clients.length) : 0

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Loading your coaching clients...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Manage your coaching clients</p>
          </div>
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
        </div>

        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Clients</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {showDebug && <AuthDebug />}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your coaching clients
            {lastFetchTime && (
              <span className="ml-2 text-xs">(Last updated: {lastFetchTime.toLocaleTimeString()})</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
          <Button onClick={handleAddClient} className="bg-[#84cc16] hover:bg-[#65a30d]">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#84cc16]" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#84cc16]" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold">{activeClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#84cc16]" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#84cc16]" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                  <p className="text-2xl font-bold">{avgCompletion}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                Status: {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {clients.length === 0 ? "No clients found" : "No matching clients"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {clients.length === 0
                ? "You don't have any clients yet. Add your first client to get started."
                : "Try adjusting your search or filter criteria."}
            </p>
            {clients.length === 0 && (
              <Button onClick={handleAddClient} className="bg-[#84cc16] hover:bg-[#65a30d]">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4" onClick={() => handleClientClick(client)}>
                    <Avatar className="w-12 h-12">
                      <AvatarFallback style={{ backgroundColor: client.bgColor, color: client.textColor }}>
                        {client.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{client.name}</h3>
                        <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {client.sessions?.completed || 0}/{client.sessions?.total || 0} sessions
                        </span>
                        <span>{client.completion || 0}% completion</span>
                        {client.lastWorkout?.name && <span>Last: {client.lastWorkout.name}</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && <AuthDebug />}

      {/* Modals */}
      <AddClientModal open={showAddModal} onOpenChange={setShowAddModal} onClientAdded={handleClientAdded} />

      {selectedClient && (
        <ClientQuickViewModal client={selectedClient} open={showQuickView} onOpenChange={setShowQuickView} />
      )}
    </div>
  )
}
