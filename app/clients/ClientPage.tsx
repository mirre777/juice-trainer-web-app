"use client"

import { useEffect, useState } from "react"
import { subscribeToClients } from "@/lib/firebase/client-service"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { Client } from "@/types/client"
import { PageLayout } from "@/components/shared/page-layout"
import { ClientList } from "@/components/clients/ClientList"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/loading-spinner" // Updated import
import { EmptyState } from "@/components/shared/empty-state"
import { useToast } from "@/hooks/use-toast"

export default function ClientPage() {
  const { user, loading: userLoading, uid: trainerUid } = useCurrentUser()
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log("ClientPage: useEffect triggered. UserLoading:", userLoading, "TrainerUID:", trainerUid)
    if (!userLoading && trainerUid) {
      console.log("ClientPage: User loaded, trainerUid is present. Setting up client subscription.")
      setLoadingClients(true)
      const unsubscribe = subscribeToClients(trainerUid, (fetchedClients, error) => {
        if (error) {
          console.error("ClientPage: Error subscribing to clients:", error)
          toast({
            title: "Error",
            description: "Failed to load clients. Please try again.",
            variant: "destructive",
          })
          setClients([])
        } else {
          console.log("ClientPage: Clients updated. Number of clients:", fetchedClients.length)
          setClients(fetchedClients)
        }
        setLoadingClients(false)
        console.log("ClientPage: LoadingClients set to false.")
      })

      return () => {
        console.log("ClientPage: Unsubscribing from clients on cleanup.")
        unsubscribe()
      }
    } else if (!userLoading && !trainerUid) {
      console.log("ClientPage: User not logged in or trainerUid is null/undefined. Not fetching clients.")
      setLoadingClients(false)
      setClients([])
    }
  }, [userLoading, trainerUid, toast])

  const handleClientAdded = () => {
    setIsAddClientModalOpen(false)
    toast({
      title: "Success",
      description: "Client added successfully!",
    })
  }

  if (userLoading || loadingClients) {
    console.log("ClientPage: Displaying loading spinner for user or clients.")
    return (
      <PageLayout title="Clients">
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner />
        </div>
      </PageLayout>
    )
  }

  console.log("ClientPage: Rendering client list or empty state. Clients count:", clients.length)
  return (
    <PageLayout title="Clients" actions={<Button onClick={() => setIsAddClientModalOpen(true)}>Add Client</Button>}>
      {clients.length === 0 ? (
        <EmptyState
          title="No Clients Yet"
          description="Add your first client to get started."
          action={<Button onClick={() => setIsAddClientModalOpen(true)}>Add Client</Button>}
        />
      ) : (
        <ClientList clients={clients} />
      )}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={handleClientAdded}
        trainerId={trainerUid || ""}
      />
    </PageLayout>
  )
}
