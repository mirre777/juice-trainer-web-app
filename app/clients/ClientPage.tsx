"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Filter } from "lucide-react"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { ClientsList } from "@/components/clients/clients-list"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { AuthDebug } from "@/components/debug/auth-debug"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { useToast } from "@/hooks/use-toast"

export default function ClientPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [expandFilter, setExpandFilter] = useState("All")
  const [collapseFilter, setCollapseFilter] = useState("All")
  const [clientFilter, setClientFilter] = useState("active-linked") // New filter state
  const { toast } = useToast()

  // Use the hybrid approach for client data with filter
  const { clients, loading, error, refetch, lastFetchTime, filterStats } = useClientDataHybrid(false, clientFilter)

  console.log("[ClientPage] Render state:", {
    clientsCount: clients.length,
    loading,
    error,
    lastFetchTime: lastFetchTime?.toISOString(),
    filterStats,
  })

  // Filter clients based on search and status (additional UI filtering)
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddClient = () => {
    setShowAddModal(true)
  }

  const handleClientAdded = () => {
    console.log("[ClientPage] Client added - real-time listener should pick it up")
    toast({
      title: "Client added",
      description: "The new client has been added successfully.",
    })
  }

  const handleClientDeleted = () => {
    refetch()
    toast({
      title: "Client deleted",
      description: "The client has been deleted successfully.",
    })
  }

  const handleFilterChange = (newFilter: string) => {
    console.log("[ClientPage] Changing filter from", clientFilter, "to", newFilter)
    setClientFilter(newFilter)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-500">Loading your coaching clients...</p>
          </div>
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
        </div>

        {showDebug && <AuthDebug />}

        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-500">Manage your coaching clients</p>
          </div>
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
        </div>

        {showDebug && <AuthDebug />}

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Manage your coaching clients</p>
          {lastFetchTime && (
            <p className="text-sm text-gray-400 mt-1">Last updated: {lastFetchTime.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh
          </Button>
          <Button
            onClick={handleAddClient}
            className="bg-lime-400 hover:bg-lime-500 text-gray-800"
            data-add-client-button="true"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">Debug Information & Filter Stats</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Showing Clients:</strong> {clients.length}
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

            {filterStats && (
              <div className="border-t pt-4">
                <strong>Database Breakdown:</strong>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>Total in DB: {filterStats.total}</div>
                  <div>Active Status: {filterStats.active}</div>
                  <div>Linked Accounts: {filterStats.linked}</div>
                  <div>Active + Linked: {filterStats.activeLinked}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Filter Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Show:</label>
              <Select value={clientFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active-linked">Active + Linked Only ({filterStats?.activeLinked || 0})</SelectItem>
                  <SelectItem value="active">All Active Clients ({filterStats?.active || 0})</SelectItem>
                  <SelectItem value="linked">All Linked Clients ({filterStats?.linked || 0})</SelectItem>
                  <SelectItem value="all">All Clients ({filterStats?.total || 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              Currently showing {clients.length} of {filterStats?.total || 0} total clients
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <ClientsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        expandFilter={expandFilter}
        onExpandFilterChange={setExpandFilter}
        collapseFilter={collapseFilter}
        onCollapseFilterChange={setCollapseFilter}
        clientCount={filteredClients.length}
        totalCount={clients.length}
      />

      {/* Clients List */}
      <ClientsList
        clients={filteredClients}
        allClientsExpanded={expandFilter === "All"}
        loading={loading}
        onClientDeleted={handleClientDeleted}
      />

      {/* Add Client Modal */}
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}
