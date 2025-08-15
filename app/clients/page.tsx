"use client"

import { useEffect, useState, useCallback } from "react"
import { ClientList } from "@/components/clients-new-design/client-list"
import { ClientDetails } from "@/components/clients-new-design/client-details/client-details"
import { ClientPageHeader } from "@/components/clients-new-design/client-page-header"
import { clientsPageStyles } from "./styles"
import type { Client } from "@/types/client"


export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [trainerInviteCode, setTrainerInviteCode] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
  }

  const handleClientDeleted = useCallback(() => {
    // Clear the selected client since it was deleted
    setSelectedClient(null)
    // Trigger a refresh of the client list
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const handleClientUpdated = useCallback((updatedClient: Client) => {
    // Update the selected client with the new data
    setSelectedClient(updatedClient)
    // Trigger a refresh of the client list
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    fetchTrainerInviteCode()
  }, [refreshTrigger])

  const fetchTrainerInviteCode = async () => {
    try {
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const userData = await response.json()
      if (userData.universalInviteCode) {
        setTrainerInviteCode(userData.universalInviteCode)
      } else {
        console.log("⚠️ [RE-INVITE] No universalInviteCode found, using fallback")
        setTrainerInviteCode("TEMP123")
      }
    } catch (error) {
      console.error("❌ [RE-INVITE] Error fetching trainer code:", error)
      setTrainerInviteCode("ERROR123")
    }
  }

  return (
    <div className={clientsPageStyles.pageContainer}>
      {/* Top Header Section */}
      <ClientPageHeader searchTerm={searchTerm} onSearchChange={handleSearchChange} />

      {/* Main Content Section */}
      <div className={clientsPageStyles.mainContainer}>
        <div className={clientsPageStyles.contentFlex}>
          {/* Left Section - Client List */}
          <div className={clientsPageStyles.clientListContainer}>
            <ClientList
              selectedClient={selectedClient}
              onClientSelect={handleClientSelect}
              searchTerm={searchTerm}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Right Section - Client Details */}
          <div className={clientsPageStyles.detailsContainer}>
            <ClientDetails
              clientId={selectedClient?.id || null}
              trainerInviteCode={trainerInviteCode}
              onClientDeleted={handleClientDeleted}
              onClientUpdated={handleClientUpdated}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
