"use client"

import { useState, useMemo } from "react"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function ClientPage() {
  const { clients, loading, error, refetch } = useClientDataHybrid()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)

  // Filter and search clients
  const filteredClients = useMemo(() => {
    if (!clients) return []

    return clients.filter((client) => {
      // Status filter
      if (statusFilter !== "all" && (client.status || "Unknown") !== statusFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const searchableFields = [client.name, client.email, client.goal, client.program, client.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchableFields.includes(searchLower)
      }

      return true
    })
  }, [clients, searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Clients</h3>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your coaching clients</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <ClientsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        clients={clients || []}
      />

      <ClientsList clients={filteredClients} />

      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onClientAdded={refetch} />
    </div>
  )
}
