"use client"

import { useState, useEffect } from "react"
import { Search, Filter, ChevronDown, PlusCircle, Share, ChevronUp } from "lucide-react"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientInvitationDialog } from "@/components/clients/client-invitation-dialog"
import { useToast } from "@/hooks/use-toast"
import { subscribeToClients, linkPendingClientsWithUsers } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"
import type { Client } from "@/types/client"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { handleClientDeleted } from "@/lib/client-utils"

interface ClientsPageLayoutProps {
  isDemo?: boolean
}

export function ClientsPageLayout({ isDemo = false }: ClientsPageLayoutProps) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const storedFilter = localStorage.getItem("clientsStatusFilter")
      console.log("[ClientsPageLayout] Initializing statusFilter. Stored:", storedFilter)
      return storedFilter || "All"
    }
    return "All"
  })
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(searchParams?.get("addClient") === "true")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{ name?: string } | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [allClientsExpanded, setAllClientsExpanded] = useState(false)
  const [trainerCode, setTrainerCode] = useState<string>("")
  const { toast } = useToast()

  // Fetch trainer's universal invite code
  useEffect(() => {
    const fetchTrainerCode = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setTrainerCode(userData.universalInviteCode || "")
        }
      } catch (error) {
        console.error("Error fetching trainer code:", error)
      }
    }

    if (!isDemo) {
      fetchTrainerCode()
    } else {
      setTrainerCode("DEMO123")
    }
  }, [isDemo])

  // Check if we should open the add client modal from URL parameters
  useEffect(() => {
    if (!searchParams) return

    const addClient = searchParams.get("addClient")
    if (addClient === "true") {
      // Get prefill data from URL parameters
      const name = searchParams.get("name")
      if (name) {
        setPrefillData({ name })
      }
    }
  }, [searchParams])

  // Set up real-time listener for clients
  useEffect(() => {
    setLoading(true)

    const trainerId = getCookie("user_id") as string
    // For demo mode, use a fixed ID
    const effectiveTrainerId = isDemo ? "demo-trainer-id" : trainerId

    if (!effectiveTrainerId) {
      setClients([])
      setFilteredClients([])
      setLoading(false)
      return
    }

    console.log("Setting up real-time client subscription for trainer:", effectiveTrainerId)

    // Run the linking process immediately when the component mounts
    if (!isDemo) {
      console.log("[ClientsPageLayout] Running initial client linking process")
      linkPendingClientsWithUsers(effectiveTrainerId)
        .then(() => {
          console.log("[ClientsPageLayout] Completed initial client linking")
        })
        .catch((error) => {
          console.error("[ClientsPageLayout] Error in initial client linking:", error)
        })
    }

    // Set up the real-time listener
    const unsubscribe = subscribeToClients(effectiveTrainerId, (updatedClients, error) => {
      if (error) {
        console.error("Error in client subscription:", error)
        toast({
          title: "Error",
          description: "Failed to update clients in real-time. Please refresh the page.",
          variant: "destructive",
        })
        return
      }

      console.log("Received real-time client update:", updatedClients.length, "clients")

      // Add demo data if needed
      const clientsWithDemoData = isDemo
        ? updatedClients.map((client) => ({
            ...client,
            progress: Math.floor(Math.random() * 100),
            sessions: {
              completed: Math.floor(Math.random() * 10),
              total: 10,
            },
            completion: Math.floor(Math.random() * 100),
            notes: client.notes || "Client is making good progress.",
            lastWorkout: {
              name: "Full Body Workout",
              date: "2 days ago",
              completion: 85,
            },
            metrics: [
              {
                name: "Weight",
                value: `${70 + Math.floor(Math.random() * 20)}kg`,
                change: "-2.5kg",
              },
              {
                name: "Body Fat",
                value: `${15 + Math.floor(Math.random() * 10)}%`,
                change: "-1.2%",
              },
            ],
          }))
        : updatedClients

      setClients(clientsWithDemoData)
      setLoading(false)

      // Run the linking process after receiving client updates
      // This ensures we check for any new users that might match our clients
      if (!isDemo) {
        console.log("[ClientsPageLayout] Running client linking after update")
        linkPendingClientsWithUsers(effectiveTrainerId)
          .then(() => {
            console.log("[ClientsPageLayout] Completed client linking after update")
          })
          .catch((error) => {
            console.error("[ClientsPageLayout] Error in client linking after update:", error)
          })
      }
    })

    // Clean up the subscription when the component unmounts
    return () => {
      console.log("Cleaning up client subscription")
      unsubscribe()
    }
  }, [isDemo, toast])

  // Handle search and filter
  useEffect(() => {
    let result = [...clients]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (client) =>
          client.name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.notes?.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "All") {
      result = result.filter((client) => client.status === statusFilter)
    }

    setFilteredClients(result)
  }, [searchQuery, statusFilter, clients])

  // Effect to save statusFilter to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("[ClientsPageLayout] Saving statusFilter to localStorage:", statusFilter)
      localStorage.setItem("clientsStatusFilter", statusFilter)
    }
  }, [statusFilter])

  const handleStatusChange = (status: string) => {
    console.log("[ClientsPageLayout] handleStatusChange called. New status:", status)
    setStatusFilter(status)
  }

  const handleToggleAll = () => {
    setAllClientsExpanded((prev) => !prev)
  }

  return (
    <div>
      <div className="pb-6"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-[300px] border border-gray-200 rounded-lg"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="appearance-none bg-transparent pr-8 text-sm focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
                <option value="Accepted Invitation">Accepted Invitation</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 absolute right-3" />
            </div>
          </div>

          {/* Toggle All Button */}
          <button
            onClick={handleToggleAll}
            className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2"
          >
            {allClientsExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm">{allClientsExpanded ? "Collapse All" : "Expand All"}</span>
          </button>

          {/* Show Code Button */}
          <Button
            onClick={() => setIsInviteDialogOpen(true)}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Share className="mr-2 h-4 w-4" />
            Show Code
          </Button>

          {/* Add New Client */}
          <Button
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-add-client-button="true"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Clients List */}
      <ClientsList
        clients={filteredClients}
        allClientsExpanded={allClientsExpanded}
        isDemo={isDemo}
        loading={loading}
        onClientDeleted={handleClientDeleted}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        isDemo={isDemo}
        prefillData={prefillData}
      />

      {/* Universal Invite Dialog */}
      {trainerCode && (
        <ClientInvitationDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          client={{ id: "universal", name: "your clients" }}
          inviteCode={trainerCode}
          isReinvite={false}
        />
      )}
    </div>
  )
}
