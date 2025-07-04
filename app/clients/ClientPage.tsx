"use client"

import { useState, useMemo } from "react"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { ClientCard } from "@/components/clients/client-card"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"

interface ClientPageProps {
  isDemo?: boolean
}

export default function ClientPage({ isDemo = false }: ClientPageProps) {
  const { clients, loading, error, refetch, lastFetchTime } = useClientDataHybrid(isDemo)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Filter and search clients
  const filteredClients = useMemo(() => {
    let filtered = clients

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.goal.toLowerCase().includes(searchLower) ||
          client.program.toLowerCase().includes(searchLower) ||
          client.notes.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [clients, statusFilter, searchTerm])

  // Calculate client counts for filter bar
  const clientCounts = useMemo(() => {
    const counts = {
      total: clients.length,
      active: 0,
      inactive: 0,
      pending: 0,
      invited: 0,
      paused: 0,
    }

    clients.forEach((client) => {
      switch (client.status?.toLowerCase()) {
        case "active":
          counts.active++
          break
        case "inactive":
          counts.inactive++
          break
        case "pending":
          counts.pending++
          break
        case "invited":
          counts.invited++
          break
        case "paused":
          counts.paused++
          break
      }
    })

    return counts
  }, [clients])

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
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Clients</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your coaching clients
            {lastFetchTime && (
              <span className="text-sm text-gray-500 ml-2">Last updated: {lastFetchTime.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refetch} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <ClientsFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clientCounts={clientCounts}
        />
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredClients.length} of {clients.length} clients
        {searchTerm && <span> matching "{searchTerm}"</span>}
        {statusFilter !== "all" && <span> with status "{statusFilter}"</span>}
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No clients match your filters" : "No clients yet"}
          description={
            searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Add your first client to get started"
          }
          action={
            searchTerm || statusFilter !== "all" ? (
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
                variant="outline"
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  )
}
