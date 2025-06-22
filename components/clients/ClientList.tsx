"use client"

import type React from "react"
import { ClientCard } from "./client-card"
import { EmptyState } from "@/components/shared/empty-state"

interface Client {
  id: string
  name: string
  email: string
  status: "active" | "pending" | "inactive"
  sessionsCompleted: number
  totalSessions: number
  lastSession?: Date
  avatar?: string
}

interface ClientListProps {
  clients: Client[]
  loading?: boolean
  onClientSelect?: (client: Client) => void
}

export const ClientList: React.FC<ClientListProps> = ({ clients, loading = false, onClientSelect }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        title="No clients found"
        description="Start by adding your first client to begin tracking their progress."
        actionLabel="Add Client"
        onAction={() => {
          /* Handle add client */
        }}
      />
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

export default ClientList
