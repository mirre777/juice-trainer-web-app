"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, Filter, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClientsList } from "@/components/clients/clients-list"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { ClientInvitationDialog } from "@/components/clients/client-invitation-dialog"
import { useToast } from "@/hooks/use-toast"
import { subscribeToClients, linkPendingClientsWithUsers } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"
import type { Client } from "@/types/client"
import { handleClientDeleted } from "@/lib/client-utils"

interface ClientsPageLayoutProps {
  children: React.ReactNode
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onAddClient: () => void
  isDemo?: boolean
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "on_hold", label: "On Hold" },
  { value: "inactive", label: "Inactive" },
  { value: "deleted", label: "Deleted" },
]

export default function ClientsPageLayout({
  children,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddClient,
  isDemo = false,
}: ClientsPageLayoutProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{ name?: string } | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [trainerCode, setTrainerCode] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
    if (statusFilter !== "all") {
      result = result.filter((client) => client.status === statusFilter)
    }

    setFilteredClients(result)
  }, [searchQuery, statusFilter, clients])

  const selectedStatus = statusOptions.find((option) => option.value === statusFilter)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 focus:ring-lime-500 focus:border-lime-500"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 min-w-[140px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Status: {selectedStatus?.label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </Button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onStatusFilterChange(option.value)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                        statusFilter === option.value ? "bg-lime-50 text-lime-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Client Button */}
          <Button onClick={onAddClient} className="bg-lime-500 hover:bg-lime-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Content */}
        {children}

        {/* Clients List */}
        <ClientsList
          clients={filteredClients}
          allClientsExpanded={false}
          isDemo={isDemo}
          loading={loading}
          onClientDeleted={handleClientDeleted}
          showInviteActions={false}
        />

        {/* Add Client Modal */}
        <AddClientModal isOpen={false} onClose={() => {}} isDemo={isDemo} prefillData={prefillData} />

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
    </div>
  )
}
