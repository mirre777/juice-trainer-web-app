"use client"

import { useState, useEffect } from "react"
import { ClientCard } from "./client-card"
import { ClientsFilterBar } from "./clients-filter-bar"
import type { Client } from "@/types/client"

interface ClientListProps {
  clients: Client[]
  onClientUpdated?: () => void
}

export function ClientList({ clients, onClientUpdated }: ClientListProps) {
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")

  useEffect(() => {
    let filtered = [...clients]

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
      filtered = filtered.filter((client) => client.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "status":
          return a.status.localeCompare(b.status)
        case "recent":
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0)
          return dateB.getTime() - dateA.getTime()
        default:
          return 0
      }
    })

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter, sortBy])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleSort = (sort: string) => {
    setSortBy(sort)
  }

  if (!clients || clients.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <ClientsFilterBar
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onSort={handleSort}
        totalClients={clients.length}
        filteredCount={filteredClients.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard key={client.id} client={client} onClientUpdated={onClientUpdated} />
        ))}
      </div>

      {filteredClients.length === 0 && clients.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No clients match your current filters</p>
        </div>
      )}
    </div>
  )
}
