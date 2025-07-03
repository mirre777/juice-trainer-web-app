"use client"

import { useState, useEffect, useMemo } from "react"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { subscribeToClients } from "@/lib/firebase/client-service"
import { getCurrentUser } from "@/lib/firebase/user-service"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import type { Client } from "@/types/client"

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [expandFilter, setExpandFilter] = useState<string>("All")
  const [collapseFilter, setCollapseFilter] = useState<string>("All")
  const { toast } = useToast()

  // Set up real-time subscription to clients
  useEffect(() => {
    console.log("[ClientPage] Setting up client subscription...")
    let unsubscribe: (() => void) | null = null

    const setupSubscription = async () => {
      try {
        console.log("[ClientPage] Getting current user...")
        const currentUser = await getCurrentUser()
        console.log("[ClientPage] Current user result:", {
          exists: !!currentUser,
          uid: currentUser?.uid,
          email: currentUser?.email,
        })

        if (!currentUser) {
          console.error("[ClientPage] No current user found")
          setError("Authentication required")
          setLoading(false)
          return
        }

        console.log("[ClientPage] Setting up subscription for user:", currentUser.uid)

        // Set up real-time subscription
        unsubscribe = subscribeToClients(currentUser.uid, (updatedClients, subscriptionError) => {
          console.log("[ClientPage] Subscription callback called:", {
            clientsCount: updatedClients.length,
            hasError: !!subscriptionError,
            errorMessage: subscriptionError?.message,
          })

          if (subscriptionError) {
            console.error("[ClientPage] Subscription error:", subscriptionError)
            setError("Failed to load clients")
            toast({
              title: "Error",
              description: "Failed to load clients. Please refresh the page.",
              variant: "destructive",
            })
          } else {
            console.log(
              "[ClientPage] Setting clients:",
              updatedClients.map((c) => ({ id: c.id, name: c.name })),
            )
            setClients(updatedClients)
            setError(null)
          }
          setLoading(false)
        })

        console.log("[ClientPage] Subscription setup complete")
      } catch (err) {
        console.error("[ClientPage] Error setting up subscription:", err)
        setError("Failed to initialize client data")
        setLoading(false)
      }
    }

    setupSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log("[ClientPage] Cleaning up subscription")
        unsubscribe()
      }
    }
  }, [toast])

  // Filter clients based on search term and filters
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search filter
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "All" || client.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  const handleClientDeleted = () => {
    // The real-time subscription will automatically update the clients list
    toast({
      title: "Client deleted",
      description: "The client has been successfully deleted.",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Manage your coaching clients</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-lime-400 hover:bg-lime-500 text-gray-800"
          data-add-client-button="true"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
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
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}
