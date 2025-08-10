"use client"

import { useState } from "react"
import { ClientList } from "@/components/clients-new-design/client-list"
import { ClientDetails } from "@/components/clients-new-design/client-details/client-details"
import { ClientPageHeader } from "@/components/clients-new-design/client-page-header"
import { clientsPageStyles } from "./styles"
import type { Client } from "@/lib/mock-data/clients"


export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const handleClientSelect = (client: any) => {
    setSelectedClient(client)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
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
            />
          </div>

          {/* Right Section - Client Details */}
          <div className={clientsPageStyles.detailsContainer}>
            <ClientDetails clientId={selectedClient?.id || null} />
          </div>
        </div>
      </div>
    </div>
  )
}
