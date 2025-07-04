"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Users, UserCheck, Clock, AlertCircle } from "lucide-react"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientCard } from "@/components/clients/client-card"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { useUnifiedClients } from "@/hooks/use-unified-clients"
import { useUnifiedAuth } from "@/hooks/use-unified-auth"

export default function ClientPage() {
  const { user, loading: authLoading } = useUnifiedAuth()
  const { clients, loading: clientsLoading, error, refreshClients } = useUnifiedClients()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Filter clients based on search and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const total = clients.length
    const active = clients.filter((c) => c.status === "Active").length
    const pending = clients.filter((c) => c.status === "Pending").length
    const inactive = clients.filter((c) => c.status === "Inactive").length

    return { total, active, pending, inactive }
  }, [clients])

  const handleAddClient = () => {
    setIsAddModalOpen(true)
  }

  const handleClientAdded = () => {
    setIsAddModalOpen(false)
    refreshClients()
  }

  // Show loading state
  if (authLoading || clientsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Error Loading Clients</h3>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
              <Button onClick={refreshClients} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships and track their progress</p>
        </div>
        <Button onClick={handleAddClient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ClientsFilterBar statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm || statusFilter !== "all" ? "No clients found" : "No clients yet"}
          description={
            searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first client"
          }
          action={
            searchTerm || statusFilter !== "all" ? undefined : (
              <Button onClick={handleAddClient} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Client
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  )
}
