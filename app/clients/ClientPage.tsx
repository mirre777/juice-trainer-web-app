"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { ClientsList } from "@/components/clients/clients-list"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/types/client"

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [expandFilter, setExpandFilter] = useState("All")
  const [collapseFilter, setCollapseFilter] = useState("All")
  const { toast } = useToast()

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[ClientPage] Fetching clients...")

      const response = await fetch("/api/clients", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[ClientPage] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ClientPage] API response data:", data)

      if (data.success && data.clients) {
        setClients(data.clients)
        console.log(`[ClientPage] Successfully loaded ${data.clients.length} clients`)
      } else {
        throw new Error(data.error || "Failed to fetch clients")
      }
    } catch (err) {
      console.error("[ClientPage] Error fetching clients:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch clients")
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    // Search filter - check multiple fields
    const matchesSearch =
      searchTerm === "" ||
      [client.name, client.email, client.goal, client.program, client.notes].some(
        (field) => field && field.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    // Status filter
    const matchesStatus = statusFilter === "All" || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddClient = () => {
    setShowAddModal(true)
  }

  const handleClientAdded = () => {
    console.log("[ClientPage] Client added - refreshing list")
    fetchClients() // Refresh the client list
    toast({
      title: "Client added",
      description: "The new client has been added successfully.",
    })
  }

  const handleClientDeleted = () => {
    fetchClients() // Refresh the client list
    toast({
      title: "Client deleted",
      description: "The client has been deleted successfully.",
    })
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-20">
        <div className="max-w-[1280px] mx-auto pt-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-gray-500">Loading your coaching clients...</p>
              </div>
            </div>

            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-20">
        <div className="max-w-[1280px] mx-auto pt-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-gray-500">Manage your coaching clients</p>
              </div>
            </div>

            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button onClick={fetchClients} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-20">
      <div className="max-w-[1280px] mx-auto pt-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
              <p className="text-gray-500">Manage your coaching clients</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchClients} variant="outline" size="sm">
                Refresh
              </Button>
              <Button
                onClick={handleAddClient}
                className="bg-lime-400 hover:bg-lime-500 text-gray-800"
                data-add-client-button="true"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>

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
          <AddClientModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAddClient={handleClientAdded}
          />
        </div>
      </div>
    </div>
  )
}
