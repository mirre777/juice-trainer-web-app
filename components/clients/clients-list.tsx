"use client"

import { useState, useEffect } from "react"
import { ClientCard } from "../client-card"
import type { Client } from "@/types/client"
import { updateClient } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"

interface ClientsListProps {
  clients: Client[]
  allClientsExpanded?: boolean // New prop
  progressBarColor?: string
  isDemo?: boolean
  loading?: boolean
  onClientDeleted?: () => void
}

export function ClientsList({
  clients,
  allClientsExpanded = false, // Default to false
  progressBarColor = "#d2ff28",
  isDemo = false,
  loading = false,
  onClientDeleted,
}: ClientsListProps) {
  const [expandedClientIds, setExpandedClientIds] = useState<string[]>([])
  const [clientsData, setClientsData] = useState<Client[]>([])
  const { toast } = useToast()

  // Initialize clients data - with validation to prevent rendering corrupted data
  useEffect(() => {
    console.log("Raw clients data received:", clients)

    if (clients && Array.isArray(clients) && clients.length > 0) {
      const validClients = clients.filter(
        (client) =>
          client &&
          typeof client === "object" &&
          client.id &&
          typeof client.id === "string" &&
          client.name &&
          typeof client.name === "string" &&
          !client.name.includes("channel?VER="), // Filter out corrupted data
      )

      console.log("Setting clientsData with valid clients:", validClients.length)
      setClientsData(validClients)
    } else {
      console.log("No clients to display, setting empty array")
      setClientsData([])
    }
  }, [clients])

  // Handle allClientsExpanded prop
  useEffect(() => {
    if (allClientsExpanded) {
      const allIds = clientsData.map((client) => client.id).filter(Boolean) as string[]
      setExpandedClientIds(allIds)
    } else {
      setExpandedClientIds([])
    }
  }, [allClientsExpanded, clientsData]) // Depend on clientsData to ensure all IDs are available

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClientIds((prev) => {
      const newExpanded = prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
      return newExpanded
    })
  }

  // Handle status change from drag and drop
  const handleStatusChange = async (clientId: string, newStatus: "Active" | "On Hold" | "Inactive") => {
    try {
      const trainerId = getCookie("user_id") as string

      if (!trainerId) {
        toast({
          title: "Error",
          description: "You must be logged in to update client status",
          variant: "destructive",
        })
        return
      }

      // Update in Firestore
      const { success, error } = await updateClient(trainerId, clientId, { status: newStatus })

      if (success) {
        toast({
          title: "Status updated",
          description: `Client status changed to ${newStatus}`,
        })
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to update client status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating client status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-48 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (!clientsData || clientsData.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-lg p-6">
        <EmptyState
          title="No clients found"
          description={
            isDemo
              ? "No clients match your current filters. Try adjusting your search or filter criteria."
              : "You don't have any clients yet. Add your first client to get started."
          }
          actionText="Add Client"
          actionIcon={<PlusCircle className="h-6 w-6" />}
          onAction={() => document.querySelector('[data-add-client-button="true"]')?.click()}
          className="py-10"
          descriptionClassName="text-sm"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {clientsData.map((client) => {
        const isExpanded = client.id ? expandedClientIds.includes(client.id) : false

        return (
          <ClientCard
            key={client.id}
            id={client.id || ""}
            name={client.name || ""}
            initials={client.initials || ""}
            status={client.status as any}
            progress={client.progress || 0}
            sessions={client.sessions || { completed: 0, total: 0 }}
            completion={client.completion || 0}
            notes={client.notes || ""}
            bgColor={client.bgColor || "#f3f4f6"}
            textColor={client.textColor || "#111827"}
            lastWorkout={client.lastWorkout || { name: "", date: "", completion: 0 }}
            metrics={client.metrics || []}
            isExpanded={isExpanded}
            onToggle={() => client.id && toggleClientExpansion(client.id)}
            client={client}
            progressBarColor={progressBarColor}
            onStatusChange={handleStatusChange}
            isDemo={isDemo}
            onDeleted={onClientDeleted}
          />
        )
      })}
    </div>
  )
}
