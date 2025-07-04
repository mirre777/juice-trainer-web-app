"use client"

import { useState } from "react"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { ClientsList } from "@/components/clients/clients-list"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { AuthDebug } from "@/components/debug/auth-debug"
import { toast } from "sonner"

export default function ClientPage() {
  const { clients, loading, error, refetch, lastFetchTime } = useClientDataHybrid()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success("Clients refreshed successfully")
    } catch (err) {
      toast.error("Failed to refresh clients")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddClient = () => {
    setShowAddModal(true)
  }

  const handleClientAdded = () => {
    setShowAddModal(false)
    // The real-time listener should automatically pick up new clients
    toast.success("Client added successfully")
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-600">Manage your coaching clients</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
              {showDebug ? "Hide" : "Show"} Debug
            </Button>
          </div>
        </div>

        {showDebug && <AuthDebug />}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Clients</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Try Again"
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-600">Manage your coaching clients</p>
          {lastFetchTime && (
            <p className="text-sm text-gray-500 mt-1">Last updated: {lastFetchTime.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
            {showDebug ? "Hide" : "Show"} Debug
          </Button>
          <Button onClick={handleAddClient} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && <AuthDebug />}

      {/* Filter Bar */}
      <ClientsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        clientCount={filteredClients.length}
        totalCount={clients.length}
      />

      {/* Clients List */}
      <ClientsList clients={filteredClients} loading={loading} />

      {/* Add Client Modal */}
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onClientAdded={handleClientAdded} />
    </div>
  )
}
