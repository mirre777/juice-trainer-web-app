"use client"

import { useState, useMemo } from "react"
import { useClientDataHybrid } from "@/lib/hooks/use-client-data-hybrid"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { ClientCard } from "@/components/clients/client-card"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Bug } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"

export default function ClientPage() {
  const { clientsData, loading, error, lastFetchTime, refetch } = useClientDataHybrid()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  // Filter and search clients
  const filteredClients = useMemo(() => {
    let filtered = clientsData

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.goal?.toLowerCase().includes(searchLower) ||
          client.program?.toLowerCase().includes(searchLower) ||
          client.notes?.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [clientsData, statusFilter, searchTerm])

  // Calculate client counts by status
  const clientCounts = useMemo(() => {
    const counts = {
      total: clientsData.length,
      active: 0,
      pending: 0,
      inactive: 0,
      invited: 0,
      paused: 0,
    }

    clientsData.forEach((client) => {
      switch (client.status?.toLowerCase()) {
        case "active":
          counts.active++
          break
        case "pending":
          counts.pending++
          break
        case "inactive":
          counts.inactive++
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
  }, [clientsData])

  const handleExpandAll = () => {
    setExpandedClients(new Set(clientsData.map((client) => client.id)))
  }

  const handleCollapseAll = () => {
    setExpandedClients(new Set())
  }

  const handleClientAdded = () => {
    refetch() // Refresh the client list
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 md:px-8 lg:px-20 max-w-[1280px] mx-auto pt-4">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-gray-600 mt-1">Manage your coaching clients</p>
              </div>
            </div>
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 md:px-8 lg:px-20 max-w-[1280px] mx-auto pt-4">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-gray-600 mt-1">Manage your coaching clients</p>
              </div>
            </div>
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">Error Loading Clients</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refetch} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 md:px-8 lg:px-20 max-w-[1280px] mx-auto pt-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
              <p className="text-gray-600 mt-1">Manage your coaching clients</p>
              {lastFetchTime && <p className="text-sm text-gray-500 mt-1">Last updated: {lastFetchTime}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDebug(!showDebug)} className="gap-2">
                <Bug className="h-4 w-4" />
                Show Debug
              </Button>
              <Button variant="outline" onClick={refetch} className="gap-2 bg-transparent">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Debug Information</h3>
              <div className="space-y-1">
                <div>Total clients in database: {clientCounts.total}</div>
                <div>Filtered clients shown: {filteredClients.length}</div>
                <div>Active: {clientCounts.active}</div>
                <div>Pending: {clientCounts.pending}</div>
                <div>Inactive: {clientCounts.inactive}</div>
                <div>Invited: {clientCounts.invited}</div>
                <div>Paused: {clientCounts.paused}</div>
                <div>Current filter: {statusFilter}</div>
                <div>Search term: "{searchTerm}"</div>
                <div>Last fetch: {lastFetchTime}</div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <ClientsFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            clientCounts={clientCounts}
            filteredCount={filteredClients.length}
          />

          {/* Clients Grid */}
          {filteredClients.length === 0 ? (
            <EmptyState
              title="No clients found"
              description={
                searchTerm || statusFilter !== "All"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first client"
              }
              action={
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  isExpanded={expandedClients.has(client.id)}
                  onToggleExpand={(id) => {
                    const newExpanded = new Set(expandedClients)
                    if (newExpanded.has(id)) {
                      newExpanded.delete(id)
                    } else {
                      newExpanded.add(id)
                    }
                    setExpandedClients(newExpanded)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAddClient={handleClientAdded} />
    </div>
  )
}
