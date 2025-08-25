"use client"

import { useEffect, useState, useCallback } from "react"
import { ClientList } from "@/components/clients-new-design/client-list"
import { ClientDetails } from "@/components/clients-new-design/client-details/client-details"
import { ClientPageHeader } from "@/components/clients-new-design/client-page-header"
import { clientsPageStyles } from "./styles"
import type { Client } from "@/types/client"


export default function ClientsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [trainerInviteCode, setTrainerInviteCode] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
  }

  const handleClientDeleted = useCallback(() => {
    // Clear the selected client since it was deleted
    setSelectedClientId(null)
    // Trigger a refresh of the client list
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const handleClientUpdated = useCallback((updatedClient: Client) => {
    // Update the selected client with the new data
    setSelectedClientId(updatedClient.id)
    // Trigger a refresh of the client list
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const handleClientAdded = useCallback(async (clientId: string) => {
    // Fetch the newly added client data and set it as selected
    setSelectedClientId(clientId)
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
      <ClientPageHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClientAdded={handleClientAdded}
      />

      {/* Main Content Section */}
      <div className={clientsPageStyles.mainContainer}>
        <div className={clientsPageStyles.contentFlex}>
          {/* Left Section - Client List */}
          <div className={clientsPageStyles.clientListContainer}>
            <ClientList
              selectedClientId={selectedClientId}
              onClientSelect={handleClientSelect}
              searchTerm={searchTerm}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Right Section - Client Details */}
          <div className={clientsPageStyles.detailsContainer}>
            <ClientDetails
              clientId={selectedClientId}
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
