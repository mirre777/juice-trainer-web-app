"use client"

import { useState, useEffect } from "react"
import { ClientsList } from "./clients/clients-list"
import { ClientsFilterBar } from "./clients/clients-filter-bar"
import { AddClientModal } from "./clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  status: "active" | "inactive" | "pending"
  joinedAt: Date
  lastWorkout?: Date
  totalWorkouts?: number
}

interface ClientsPageLayoutProps {
  initialClients?: Client[]
}

export default function ClientsPageLayout({ initialClients = [] }: ClientsPageLayoutProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [filteredClients, setFilteredClients] = useState<Client[]>(initialClients)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all")
  const { user, loading } = useCurrentUser()

  const refreshClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error("Failed to refresh clients:", error)
    }
  }

  useEffect(() => {
    if (user && !loading) {
      refreshClients()
    }
  }, [user, loading])

  useEffect(() => {
    let filtered = clients

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-600">{clients.length} total clients</p>
          </div>
        </div>
        <Button onClick={() => setIsAddClientOpen(true)} className="flex items-center gap-2">
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
      />

      <ClientsList clients={filteredClients} onClientUpdate={refreshClients} />

      <AddClientModal open={isAddClientOpen} onOpenChange={setIsAddClientOpen} onClientAdded={refreshClients} />
    </div>
  )
}

// Named export for compatibility
export { ClientsPageLayout }
