"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { subscribeToClients } from "@/lib/firebase/client-service"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import type { Client } from "@/types/client"
import LoadingSpinner from "@/components/shared/loading-spinner"

export function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [allClientsExpanded, setAllClientsExpanded] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.uid) {
      console.log("[ClientPage] No user ID available")
      router.push("/login")
      return
    }

    console.log("[ClientPage] Setting up client subscription for user:", user.uid)
    setLoading(true)
    setError(null)

    // Subscribe to real-time client updates
    const unsubscribe = subscribeToClients(user.uid, (clientsData, error) => {
      console.log("[ClientPage] Received clients update:", {
        clientsCount: clientsData.length,
        error: error?.message,
      })

      if (error) {
        console.error("[ClientPage] Error in client subscription:", error)
        setError(error.message || "Failed to load clients")
        setLoading(false)
        return
      }

      // Filter out deleted clients and invalid data
      const validClients = clientsData.filter((client) => {
        return client && client.id && client.name && client.status !== "Deleted"
      })

      console.log("[ClientPage] Setting valid clients:", validClients.length)
      setClients(validClients)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log("[ClientPage] Cleaning up client subscription")
      unsubscribe()
    }
  }, [user?.uid, router])

  // Filter clients based on search and status
  useEffect(() => {
    let filtered = clients

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchQuery, statusFilter])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
  }

  const handleExpandAll = () => {
    setAllClientsExpanded(true)
  }

  const handleCollapseAll = () => {
    setAllClientsExpanded(false)
  }

  const handleAddClient = () => {
    setShowAddModal(true)
  }

  const handleClientAdded = (clientId: string) => {
    setShowAddModal(false)
    // The subscription will automatically update the clients list
  }

  const handleGoToClient = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const handleClientDeleted = () => {
    // The subscription will automatically update the clients list
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600">Error loading clients: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your coaching clients</p>
        </div>
        <Button
          onClick={handleAddClient}
          className="flex items-center gap-2 bg-lime-500 hover:bg-lime-600"
          data-add-client-button="true"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filter Bar */}
      <ClientsFilterBar
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        statusFilter={statusFilter}
      >
        <Button
          onClick={handleAddClient}
          className="bg-lime-500 hover:bg-lime-600 text-black"
          data-add-client-button="true"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </ClientsFilterBar>

      {/* Clients List */}
      <ClientsList
        clients={filteredClients}
        allClientsExpanded={allClientsExpanded}
        progressBarColor="#d2ff28"
        loading={loading}
        onClientDeleted={handleClientDeleted}
      />

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddClient={handleClientAdded}
          onGoToClient={handleGoToClient}
        />
      )}
    </div>
  )
}

export default ClientPage
