"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { ClientList } from "@/components/clients/ClientList"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { subscribeToClients } from "@/lib/firebase/client-service"
import type { Client } from "@/types/client"
import { getCookie } from "cookies-next"

export default function ClientPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch clients when component mounts or user changes
  useEffect(() => {
    console.log("[ClientPage] Effect triggered, user:", user)

    if (!user) {
      console.log("[ClientPage] No user, setting loading to false")
      setLoading(false)
      return
    }

    // Try to get user ID from cookie as fallback
    const userId = user.uid || getCookie("user_id")?.toString()

    if (!userId) {
      console.log("[ClientPage] No user ID available")
      setError("User not authenticated")
      setLoading(false)
      return
    }

    console.log("[ClientPage] Setting up client subscription for user:", userId)
    setLoading(true)
    setError(null)

    // Subscribe to real-time client updates
    const unsubscribe = subscribeToClients(userId, (clientsData, subscriptionError) => {
      console.log("[ClientPage] Received clients data:", clientsData)

      if (subscriptionError) {
        console.error("[ClientPage] Subscription error:", subscriptionError)
        setError("Failed to load clients")
        setClients([])
      } else {
        console.log("[ClientPage] Setting clients:", clientsData.length, "clients")
        setClients(clientsData || [])
        setError(null)
      }

      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log("[ClientPage] Cleaning up subscription")
      unsubscribe()
    }
  }, [user])

  // Filter clients based on search term and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  console.log("[ClientPage] Rendering with:", {
    loading,
    error,
    clientsCount: clients.length,
    filteredCount: filteredClients.length,
    searchTerm,
    statusFilter,
  })

  const handleAddClient = () => {
    console.log("[ClientPage] Add client clicked")
    setShowAddModal(true)
  }

  const handleClientAdded = (clientId: string) => {
    console.log("[ClientPage] Client added:", clientId)
    setShowAddModal(false)
    // The subscription will automatically update the clients list
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button onClick={handleAddClient} className="bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading clients...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button onClick={handleAddClient} className="bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" className="mt-2 bg-transparent" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button onClick={handleAddClient} className="bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <ClientsFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clientsCount={filteredClients.length}
        />
      </div>

      {/* Client List */}
      <ClientList
        clients={filteredClients}
        loading={false}
        onClientSelect={(client) => {
          console.log("[ClientPage] Client selected:", client.id)
          // Navigate to client details page
          window.location.href = `/clients/${client.id}`
        }}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddClient={handleClientAdded}
        onGoToClient={(clientId) => {
          window.location.href = `/clients/${clientId}`
        }}
      />
    </div>
  )
}
