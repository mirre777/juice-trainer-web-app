"use client"

import type { Client } from "@/types/client"
import { ClientCard } from "./client-card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"

interface ClientListProps {
  clients: Client[]
  loading: boolean
  onClientSelect?: (client: Client) => void
  onAddClient?: () => void
}

export function ClientList({ clients, loading, onClientSelect, onAddClient }: ClientListProps) {
  console.log("[ClientList] Rendering with:", { clientsCount: clients.length, loading })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading clients...</span>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
        {onAddClient && (
          <Button onClick={onAddClient} className="bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} onClick={() => onClientSelect?.(client)} />
      ))}
    </div>
  )
}
