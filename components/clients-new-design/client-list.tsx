"use client"

import { useEffect, useState } from "react"
import type { Client } from "@/types/client"
import { clientsPageStyles } from "../../app/clients-new-design/styles"

interface ClientListProps {
  selectedClient: Client | null
  onClientSelect: (client: Client) => void
  searchTerm: string
}

export function ClientList({ selectedClient, onClientSelect, searchTerm }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      const response = await fetch("/api/clients")
      const data = await response.json()
      if (data.success) {
        const clients = data.clients as Client[]
        setClients(clients)
      } else {
        console.error("❌ [ClientList] Failed to fetch clients")
      }
      setIsLoading(false)
    }
    fetchClients()
  }, [])

  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  useEffect(() => {
    const filteredClients = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filteredClients.length === 1) {
      onClientSelect(filteredClients[0])
    }
    setFilteredClients(filteredClients)
  }, [clients, searchTerm])

  const getClientItemStyle = (isSelected: boolean) => {
    return isSelected ? clientsPageStyles.clientItemSelected : clientsPageStyles.clientItemHover
  }

  const getClientStatusStyle = (status: Client['status']) => {
    switch (status) {
      case 'Active':
        return clientsPageStyles.clientStatusActive
      case 'Pending':
        return clientsPageStyles.clientStatusPending
      case 'Inactive':
        return clientsPageStyles.clientStatusInactive
      case 'Deleted':
        return clientsPageStyles.clientStatusDeleted
      default:
        return clientsPageStyles.clientStatusInactive
    }
  }

  return (
    <div className={clientsPageStyles.clientListContent}>
      {/* Client List */}
      <div className={clientsPageStyles.clientListScroll}>
        <div>
          {isLoading ? (
            <div className={clientsPageStyles.clientListLoading}>Loading...</div>
          ) : (
            filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => onClientSelect(client)}
              className={getClientItemStyle(selectedClient?.id === client.id)}
            >
              <div className={clientsPageStyles.clientItemFlex}>
                {/* Avatar */}
                <div
                  className={clientsPageStyles.clientAvatar}
                  style={{
                    backgroundColor: selectedClient?.id === client.id ? "#D2FF28" : "#FFFFFF",
                    color:  "black"
                  }}
                >
                  {client.initials}
                </div>

                {/* Client Info */}
                <div className={clientsPageStyles.clientInfo}>
                  <div className={clientsPageStyles.clientNameRow}>
                    <h3 className={clientsPageStyles.clientName}>
                      {client.name}
                    </h3>
                    <span className={getClientStatusStyle(client.status)}>
                      {client.status}
                    </span>
                  </div>

                  <div className={clientsPageStyles.clientWorkoutInfo}>
                    <p className={clientsPageStyles.clientWorkoutText}>
                      {client.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  )
}