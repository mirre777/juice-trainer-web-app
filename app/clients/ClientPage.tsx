"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClientsList } from "@/components/clients/clients-list"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import type { Client } from "@/types/client"
import { useToast } from "@/hooks/use-toast"
import { fetchClients } from "@/lib/firebase/client-service"

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [allClientsExpanded, setAllClientsExpanded] = useState(false)
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch clients using the client service (same as Overview page)
  const fetchClientsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user ID from cookie (same approach as Overview page)
      const userIdCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_id="))
        ?.split("=")[1]

      if (!userIdCookie) {
        router.push("/login")
        return
      }

      console.log("Fetching clients for trainer:", userIdCookie)

      // Use the same client service as Overview page
      const clientsData = await fetchClients(userIdCookie)
      console.log("Fetched clients:", clientsData)

      // Filter out deleted clients
      const activeClients = clientsData.filter((client) => client.status !== "Deleted")

      setClients(activeClients)
      setFilteredClients(activeClients)

      toast({
        title: "Success",
        description: `Loaded ${activeClients.length} clients`,
      })
    } catch (error) {
      console.error("Error fetching clients:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch clients"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchClientsData()
  }, [])

  // Filter clients based on search and status
  useEffect(() => {
    let filtered = clients

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const handleClientDeleted = () => {
    // Refresh the clients list after deletion
    fetchClientsData()
  }

  const handleClientAdded = () => {
    // Refresh the clients list after adding a new client
    fetchClientsData()
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Clients</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchClientsData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your coaching clients</p>
        </div>
      </div>

      <ClientsFilterBar
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        statusFilter={statusFilter}
      >
        <Button
          onClick={() => setShowAddClientModal(true)}
          className="bg-[#d2ff28] text-black hover:bg-[#c1f01f] font-medium"
          data-add-client-button="true"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </ClientsFilterBar>

      <ClientsList
        clients={filteredClients}
        allClientsExpanded={allClientsExpanded}
        loading={loading}
        onClientDeleted={handleClientDeleted}
      />

      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  )
}
