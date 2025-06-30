"use client"
import { ClientCard } from "./client-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import type { Client } from "@/types/client"

interface ClientsListProps {
  clients: Client[]
  loading?: boolean
  onAddClient?: () => void
}

export function ClientsList({ clients, loading = false, onAddClient }: ClientsListProps) {
  console.log("[ClientsList] Rendering with clients:", {
    count: clients.length,
    loading,
    clientIds: clients.map((c) => c.id),
    clientNames: clients.map((c) => c.name),
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!clients || clients.length === 0) {
    console.log("[ClientsList] No clients to display")
    return (
      <EmptyState
        icon={Users}
        title="No clients found"
        description="Get started by adding your first client."
        action={
          onAddClient && (
            <Button onClick={onAddClient} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          )
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => {
          console.log("[ClientsList] Rendering client:", {
            id: client.id,
            name: client.name,
            status: client.status,
          })

          return <ClientCard key={client.id} client={client} />
        })}
      </div>
    </div>
  )
}
