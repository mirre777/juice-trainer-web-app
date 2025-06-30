"use client"

import type React from "react"
import { ClientCard } from "./client-card"

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
  console.log("[ClientList] Rendering with:", { clientsCount: clients.length, loading })

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
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500 mb-4">Get started by adding your first client to begin tracking their progress.</p>
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

export default ClientList
