"use client"

import { useState } from "react"
import { UnifiedHeader } from "@/components/unified-header"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Bug } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ClientPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDebug, setShowDebug] = useState(false)
  const { toast } = useToast()

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
    toast({
      title: "Refreshed",
      description: "Client data has been refreshed",
    })
  }

  const handleClientAdded = () => {
    setIsAddModalOpen(false)
    setRefreshTrigger((prev) => prev + 1)
    toast({
      title: "Success",
      description: "Client has been added successfully",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-2">Manage your coaching clients</p>
            <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="bg-transparent">
              <Bug className="h-4 w-4 mr-2" />
              Show Debug
            </Button>

            <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#CCFF00] text-black hover:bg-[#b8e600] font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Clients List */}
        <ClientsList refreshTrigger={refreshTrigger} showDebug={showDebug} />

        {/* Add Client Modal */}
        <AddClientModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onClientAdded={handleClientAdded}
        />
      </div>
    </div>
  )
}
