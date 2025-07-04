"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus } from "lucide-react"
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
  const { toast } = useToast()

  // Use the hybrid approach for client data
  const { clients, loading, error, refetch, lastFetchTime } = useClientDataHybrid(false)

  console.log("[ClientPage] Render state:", {
    clientsCount: clients.length,
    loading,
    error,
    lastFetchTime: lastFetchTime?.toISOString(),
  })

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    // Search filter - check multiple fields
    const matchesSearch =
      searchTerm === "" ||
      [client.name, client.email, client.goal, client.program, client.notes].some(
        (field) => field && field.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    // Status filter
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-20">
        <div className="max-w-[1280px] mx-auto pt-4">
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-20">
        <div className="max-w-[1280px] mx-auto pt-4">
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
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-20">
      <div className="max-w-[1280px] mx-auto pt-4">
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
                <CardTitle className="text-sm text-yellow-800">Debug Information</CardTitle>
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
              </CardContent>
            </Card>
          )}

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
      </div>
    </div>
  )
}
