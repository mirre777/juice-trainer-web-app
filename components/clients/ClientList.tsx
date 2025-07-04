"use client"

import { useState } from "react"
import { ClientCard } from "./client-card"
import { EmptyState } from "@/components/shared/empty-state"
import type { Client } from "@/types/client"

interface ClientListProps {
  clients: Client[]
  onClientUpdated?: (client: Client) => void
  onClientDeleted?: (clientId: string) => void
}

export function ClientList({ clients, onClientUpdated, onClientDeleted }: ClientListProps) {
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  const handleClientUpdate = (updatedClient: Client) => {
    onClientUpdated?.(updatedClient)
  }

  const handleClientDelete = async (clientId: string) => {
    setDeletingClientId(clientId)
    try {
      // Call the delete handler
      onClientDeleted?.(clientId)
    } finally {
      setDeletingClientId(null)
    }
  }

  if (!clients || clients.length === 0) {
    return (
      <EmptyState
        title="No clients found"
        description="Start by adding your first client to begin coaching."
        actionLabel="Add Client"
        onAction={() => {
          // This will be handled by the parent component
          console.log("Add client clicked from empty state")
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          onUpdate={handleClientUpdate}
          onDelete={handleClientDelete}
          isDeleting={deletingClientId === client.id}
        />
      ))}
    </div>
  )
}
