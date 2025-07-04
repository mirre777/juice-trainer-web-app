"use client"

import { useState, useEffect } from "react"
import { ClientList } from "@/components/clients/ClientList"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Client } from "@/types/client"
import LoadingSpinner from "@/components/shared/loading-spinner"

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log("[ClientPage] Fetching clients...")

        const response = await fetch("/api/clients", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch clients: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          console.log(`[ClientPage] Successfully loaded ${data.clients.length} clients`)
          setClients(data.clients || [])
        } else {
          throw new Error(data.error || "Failed to fetch clients")
        }
      } catch (err) {
        console.error("[ClientPage] Error fetching clients:", err)
        setError(err instanceof Error ? err.message : "Failed to load clients")
        setClients([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Filter clients based on search term and status
  useEffect(() => {
    let filtered = clients

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status.toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter])

  const handleClientAdded = (newClient: Client) => {
    console.log("[ClientPage] New client added:", newClient)
    setClients((prev) => [newClient, ...prev])
    setIsAddModalOpen(false)
  }

  const handleClientUpdated = (updatedClient: Client) => {
    console.log("[ClientPage] Client updated:", updatedClient)
    setClients((prev) => prev.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
  }

  const handleClientDeleted = (clientId: string) => {
    console.log("[ClientPage] Client deleted:", clientId)
    setClients((prev) => prev.filter((client) => client.id !== clientId))
  }

  if (isLoading) {
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
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your coaching clients ({clients.length} total)</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <ClientsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        clientCount={filteredClients.length}
        totalCount={clients.length}
      />

      <ClientList
        clients={filteredClients}
        onClientUpdated={handleClientUpdated}
        onClientDeleted={handleClientDeleted}
      />

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  )
}
