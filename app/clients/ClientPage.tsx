"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ClientsList } from "@/components/clients/clients-list"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { AuthDebug } from "@/components/debug/auth-debug"
import { AddClientModal } from "@/components/clients/add-client-modal"

export default function ClientPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [expandFilter, setExpandFilter] = useState("All")
  const [collapseFilter, setCollapseFilter] = useState("All")

  // Use the hybrid approach for client data
  const { clients, loading, error, refetch, lastFetchTime } = useClientDataHybrid()

  console.log("[ClientPage] Render state:", {
    clientsCount: clients.length,
    loading,
    error,
    lastFetchTime: lastFetchTime?.toISOString(),
  })

  // Filter clients based on search and status
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
    // The hybrid approach will automatically pick up new clients via real-time listener
    console.log("[ClientPage] Client added - real-time listener should pick it up")
  }

  const handleClientDeleted = () => {
    // Refresh the data when a client is deleted
    refetch()
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

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Clients</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
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
          <p className="text-gray-500">
            Manage your coaching clients
            {lastFetchTime && (
              <span className="text-sm text-gray-400 ml-2">(Last updated: {lastFetchTime.toLocaleTimeString()})</span>
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
          <Button
            onClick={handleAddClient}
            className="bg-lime-400 hover:bg-lime-500 text-gray-800"
            data-add-client-button="true"
          >
            + Add Client
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && <AuthDebug />}

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
