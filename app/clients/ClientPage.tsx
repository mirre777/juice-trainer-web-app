"use client"

import { useState } from "react"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { UnifiedPageLayout } from "@/components/shared/unified-page-layout"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useClientDataUnified } from "@/lib/hooks/use-client-data-unified"

export default function ClientPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [allClientsExpanded, setAllClientsExpanded] = useState(false)

  // Use the new unified hook
  const { clients, loading, error, refetch } = useClientDataUnified(false)

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleAddClient = (clientId: string) => {
    console.log("Client added:", clientId)
    refetch() // Refresh the client list
  }

  const handleClientDeleted = () => {
    console.log("Client deleted, refreshing list")
    refetch() // Refresh the client list
  }

  return (
    <UnifiedPageLayout
      title="Clients"
      description="Manage your coaching clients and track their progress"
      showBackButton={false}
    >
      <div className="space-y-6">
        {/* Header with Add Client Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">
              {loading ? "Loading..." : `${filteredClients.length} client${filteredClients.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#d2ff28] text-black hover:bg-[#c5f01a] flex items-center gap-2"
            data-add-client-button="true"
          >
            <PlusCircle className="h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Filter Bar */}
        <ClientsFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          allClientsExpanded={allClientsExpanded}
          onToggleAllExpanded={setAllClientsExpanded}
          clientCount={filteredClients.length}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">Error loading clients: {error}</p>
            <Button onClick={refetch} variant="outline" size="sm" className="mt-2 bg-transparent">
              Try Again
            </Button>
          </div>
        )}

        {/* Clients List */}
        <ClientsList
          clients={filteredClients}
          allClientsExpanded={allClientsExpanded}
          progressBarColor="#d2ff28"
          isDemo={false}
          loading={loading}
          onClientDeleted={handleClientDeleted}
        />

        {/* Add Client Modal */}
        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddClient={handleAddClient}
          isDemo={false}
        />
      </div>
    </UnifiedPageLayout>
  )
}
