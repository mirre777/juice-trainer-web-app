"use client"

import { useState, useEffect, useRef } from "react"
import { PageLayout } from "@/components/shared/page-layout"
import { ClientsList } from "@/components/clients/clients-list"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { subscribeToClients, linkPendingClientsWithUsers } from "@/lib/firebase/client-service"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { useToast } from "@/hooks/use-toast"

export default function ClientPage() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const { userId } = useCurrentUser()
  const { toast } = useToast()
  const { error, handleError } = useErrorHandler({
    context: { component: "ClientsPage" },
  })

  // Use a ref to track if we've already set up the subscription
  const subscriptionSetup = useRef(false)
  // Use a ref to store the unsubscribe function
  const unsubscribeRef = useRef(() => {})
  // Use a ref to track if we've already run the linking process
  const linkingProcessRun = useRef(false)

  // Set up real-time listener for clients - only once when userId is available
  useEffect(() => {
    // If we don't have a userId or we've already set up the subscription, do nothing
    if (!userId || subscriptionSetup.current) {
      return
    }

    console.log("Setting up real-time listener for clients")
    setLoading(true)

    try {
      // Mark that we're setting up the subscription
      subscriptionSetup.current = true

      // First, try to link any pending clients with user accounts
      if (!linkingProcessRun.current) {
        console.log("Running client-user linking process")
        linkPendingClientsWithUsers(userId)
          .then(() => {
            console.log("Client-user linking process completed")
            linkingProcessRun.current = true
          })
          .catch((err) => {
            console.error("Error in client-user linking process:", err)
          })
      }

      // Subscribe to client changes
      unsubscribeRef.current = subscribeToClients(userId, (updatedClients, subscriptionError) => {
        if (subscriptionError) {
          handleError(subscriptionError, { operation: "subscribeToClients" })
          toast({
            title: "Error loading clients",
            description: "There was a problem loading your clients. Please try again.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        console.log("Received updated clients:", updatedClients)

        // Force a re-render by creating a new array
        setClients([...updatedClients])
        setLoading(false)
      })
    } catch (err) {
      handleError(err, { operation: "subscribeToClients" })
      toast({
        title: "Error loading clients",
        description: "There was a problem loading your clients. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up client subscription")
      unsubscribeRef.current()
    }
  }, [userId, handleError, toast])

  // Force re-filtering when clients change
  useEffect(() => {
    if (clients && clients.length > 0) {
      console.log("Clients changed, re-filtering...")

      let filtered = [...clients]

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (client) =>
            (client.name && typeof client.name === "string" && client.name.toLowerCase().includes(term)) ||
            (client.email && typeof client.email === "string" && client.email.toLowerCase().includes(term)),
        )
      }

      // Apply status filter
      if (statusFilter !== "All") {
        filtered = filtered.filter((client) => client.status === statusFilter)
      }

      setFilteredClients(filtered)
    } else {
      setFilteredClients([])
    }
  }, [clients, searchTerm, statusFilter])

  const handleClientAdded = (newClient) => {
    setIsAddClientModalOpen(false)
    toast({
      title: "Client added",
      description: `${newClient.name} has been added to your clients.`,
    })
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <ClientsFilterBar onSearch={setSearchTerm} onStatusChange={setStatusFilter} statusFilter={statusFilter} />
          <Button
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-[#CCFF00] text-black hover:bg-[#b8e600]"
            data-testid="add-client-button"
            data-add-client-button="true"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            <p className="font-medium">Error loading clients</p>
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        <ClientsList clients={filteredClients} loading={loading} />
      </div>

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </PageLayout>
  )
}
