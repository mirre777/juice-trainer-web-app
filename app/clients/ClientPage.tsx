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
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import type { Client } from "@/types/client"

export default function ClientPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    if (!user?.uid) {
      console.log("[ClientPage] No user UID available")
      setLoading(false)
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
        clients: clientsData.map((c) => ({ id: c.id, name: c.name, status: c.status })),
      })

      if (error) {
        console.error("[ClientPage] Error in client subscription:", error)
        setError(error.message || "Failed to load clients")
        setLoading(false)
        return
      }

      // Filter out deleted clients and invalid data
      const validClients = clientsData.filter((client) => {
        const isValid =
          client && client.id && client.name && client.status !== "Deleted" && !client.name.includes("channel?VER=") // Filter out corrupted data

        if (!isValid) {
          console.log("[ClientPage] Filtering out invalid client:", client)
        }

        return isValid
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
  }, [user?.uid])

  // Filter clients based on search term and status
  useEffect(() => {
    let filtered = clients

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => {
        switch (statusFilter) {
          case "active":
            return client.status === "Active"
          case "pending":
            return client.status === "Pending"
          case "inactive":
            return client.status === "Inactive"
          default:
            return true
        }
      })
    }

    console.log("[ClientPage] Filtered clients:", {
      total: clients.length,
      filtered: filtered.length,
      searchTerm,
      statusFilter,
    })

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter])

  const handleAddClient = () => {
    setShowAddModal(true)
  }

  const handleClientAdded = () => {
    setShowAddModal(false)
    // The subscription will automatically update the clients list
  }

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
        <p className="text-red-600">Error loading clients: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your coaching clients ({clients.length} total)</p>
        </div>
        <Button onClick={handleAddClient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filter Bar */}
      <ClientsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        clientsCount={filteredClients.length}
      />

      {/* Clients List */}
      <ClientsList clients={filteredClients} loading={loading} onAddClient={handleAddClient} />

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onClientAdded={handleClientAdded}
        />
      )}
    </div>
  )
}
