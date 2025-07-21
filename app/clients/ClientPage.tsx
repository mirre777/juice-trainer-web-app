"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ClientList } from "@/components/clients/ClientList"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsPageLayout } from "@/components/clients-page-layout"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { fetchClients } from "@/lib/firebase/client-service"
import type { Client } from "@/types/client"

export default function ClientPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const loadClients = async (showLoadingState = true) => {
    if (!user?.uid) {
      console.log("[ClientPage] No user UID available")
      return
    }

    if (showLoadingState) {
      setLoading(true)
    }
    setError(null)

    try {
      console.log("[ClientPage] Loading clients for user:", user.uid)
      const clientsData = await fetchClients(user.uid)
      console.log("[ClientPage] Loaded clients:", clientsData.length)

      setClients(clientsData)
      setError(null)
    } catch (err) {
      console.error("[ClientPage] Error loading clients:", err)
      setError("Failed to load clients. Please try again.")
    } finally {
      if (showLoadingState) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!userLoading && user?.uid) {
      loadClients()
    } else if (!userLoading && !user) {
      setLoading(false)
      setError("Authentication required")
    }
  }, [user, userLoading, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    loadClients()
  }

  const handleClientAdded = () => {
    console.log("[ClientPage] Client added, refreshing list")
    loadClients(false) // Refresh without showing loading state
  }

  if (userLoading || loading) {
    return (
      <ClientsPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </ClientsPageLayout>
    )
  }

  if (error) {
    return (
      <ClientsPageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <EmptyState icon="error" title="Error Loading Clients" description={error} />
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </ClientsPageLayout>
    )
  }

  return (
    <ClientsPageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-gray-600">Manage your coaching clients</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            icon="users"
            title="No clients yet"
            description="Add your first client to get started"
            action={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            }
          />
        ) : (
          <ClientList clients={clients} onClientUpdated={handleClientAdded} />
        )}

        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onClientAdded={handleClientAdded}
        />
      </div>
    </ClientsPageLayout>
  )
}
