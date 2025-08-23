"use client"

import { useEffect, useState } from "react"
import type { Client } from "@/types/client"
import { clientsPageStyles } from "../../app/clients/styles"
import { capitalize } from "@/lib/utils"
import { Skeleton } from "../ui/skeleton"

interface ClientListProps {
  selectedClient: Client | null
  onClientSelect: (client: Client | null) => void
  searchTerm: string
  refreshTrigger: number
}

export function ClientList({ selectedClient, onClientSelect, searchTerm, refreshTrigger }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      const response = await fetch("/api/clients")
      const data = await response.json()
      if (data.success) {
        const clients = data.clients.sort((a: Client, b: Client) => a.name.localeCompare(b.name)) as Client[]
        setClients(clients)
        if (!selectedClient && clients.length > 0) {
          onClientSelect(clients[0])
        } else {
          onClientSelect(selectedClient)
        }
      } else {
        console.error("❌ [ClientList] Failed to fetch clients")
      }
      setIsLoading(false)
    }
    fetchClients()
  }, [refreshTrigger])

  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  useEffect(() => {
    const filteredClients = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a: Client, b: Client) => a.name.localeCompare(b.name))
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

  const clientSkeleton = () => {
    return (
      <div className={clientsPageStyles.clientItemHover}>
        <div className={clientsPageStyles.clientItemFlex}>
          <Skeleton className={clientsPageStyles.clientAvatar} />
          <div className={clientsPageStyles.clientInfo}>
            <div className={clientsPageStyles.clientNameRow}>
              <h3 className={clientsPageStyles.clientName}>
                <Skeleton className="w-36 h-4"/>
              </h3>
            </div>
            <div className={clientsPageStyles.clientWorkoutInfo}>
              <h1 className={clientsPageStyles.clientWorkoutText}>
                <Skeleton className="w-28 h-4"/>
              </h1>
              </div>
            </div>
        </div>
      </div>
    )
  }

  const clientItem = (client: Client) => {
    if (isLoading) return <Skeleton />
    return (
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
                backgroundColor: selectedClient?.id === client.id ? "#D2FF28" : "#F9FAFB",
                color:  "black"
              }}
            >
              {client.initials}
            </div>

            {/* Client Info */}
            <div className={clientsPageStyles.clientInfo}>
              <div className={clientsPageStyles.clientNameRow}>
                <h3 className={clientsPageStyles.clientName}>
                  {capitalize(client.name)}
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
    )
  }

  return (
    <div className={clientsPageStyles.clientListContent}>
      {/* Client List */}
      <div className={clientsPageStyles.clientListScroll}>
        <div>
          {isLoading ? (
            Array.from({ length: 10 }, (_, index) => (
              <div key={index} className={clientsPageStyles.clientItem}>
                {clientSkeleton()}
              </div>
            ))
          ) : (
            filteredClients.map((client) => (
              clientItem(client)
          )))}
        </div>
      </div>
    </div>
  )
}