"use client"

import { useState, useEffect, useCallback } from "react"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { UnifiedPageLayout } from "@/components/shared/unified-page-layout"
import { subscribeToClients } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [allClientsExpanded, setAllClientsExpanded] = useState(false)
  const { toast } = useToast()

  // Get trainer ID from cookie
  const trainerId = getCookie("user_id") as string

  // Subscribe to clients data
  useEffect(() => {
    if (!trainerId) {
      console.error("No trainer ID found in cookies")
      setError("Authentication required")
      setLoading(false)
      return
    }

    console.log("Setting up clients subscription for trainer:", trainerId)

    const unsubscribe = subscribeToClients(trainerId, (clientsData, subscriptionError) => {
      console.log("Received clients update:", clientsData.length, "clients")

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError)
        setError("Failed to load clients")
        toast({
          title: "Error loading clients",
          description: subscriptionError.message || "Please try refreshing the page",
          variant: "destructive",
        })
      } else {
        setClients(clientsData)
        setError(null)
      }

      setLoading(false)
    })

    return () => {
      console.log("Cleaning up clients subscription")
      unsubscribe()
    }
  }, [trainerId, toast])

  // Filter clients based on search and status
  useEffect(() => {
    let filtered = clients

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter])

  const handleClientDeleted = useCallback(() => {
    // The subscription will automatically update the clients list
    toast({
      title: "Client deleted",
      description: "The client has been successfully removed",
    })
  }, [toast])

  const handleClientAdded = useCallback(() => {
    // The subscription will automatically update the clients list
    setIsAddClientModalOpen(false)
    toast({
      title: "Client added",
      description: "The new client has been successfully added",
    })
  }, [toast])

  if (!trainerId) {
    return (
      <UnifiedPageLayout title="Clients" description="Manage your coaching clients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to view your clients.</p>
          </div>
        </div>
      </UnifiedPageLayout>
    )
  }

  if (error) {
    return (
      <UnifiedPageLayout title="Clients" description="Manage your coaching clients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Clients</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </UnifiedPageLayout>
    )
  }

  return (
    <UnifiedPageLayout
      title="Clients"
      description="Manage your coaching clients"
      action={
        <Button
          onClick={() => setIsAddClientModalOpen(true)}
          data-add-client-button="true"
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      }
    >
      <div className="space-y-6">
        <ClientsFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          allClientsExpanded={allClientsExpanded}
          onToggleAllExpanded={setAllClientsExpanded}
          clientsCount={filteredClients.length}
        />

        <ClientsList
          clients={filteredClients}
          allClientsExpanded={allClientsExpanded}
          loading={loading}
          onClientDeleted={handleClientDeleted}
        />

        <AddClientModal
          isOpen={isAddClientModalOpen}
          onClose={() => setIsAddClientModalOpen(false)}
          onClientAdded={handleClientAdded}
        />
      </div>
    </UnifiedPageLayout>
  )
}
