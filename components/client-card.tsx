"use client"

import { ChevronDown, ChevronUp, Trash, Eye, Send, Dumbbell } from "lucide-react"
import type React from "react"

import Link from "next/link"
import { usePathDetection } from "@/lib/hooks/use-path-detection"
import { useState, useRef, useEffect } from "react"
import { ClientQuickViewModal } from "./clients/client-quick-view-modal"
import { ClientInitials } from "./shared/client-initials"
import { DeleteClientDialog } from "./clients/delete-client-dialog"
import { ClientInvitationDialog } from "./clients/client-invitation-dialog"
import { updateClient } from "@/lib/firebase/client-service"
import { useCurrentUser } from "@/hooks/use-current-user"

interface ClientCardProps {
  id?: string
  name: string
  initials: string
  status: "Active" | "On Hold" | "Inactive" | "pending" | null | "Deleted"
  progress: number
  sessions: { completed: number; total: number }
  completion: number
  notes: string
  bgColor: string
  textColor: string
  lastWorkout?: {
    name: string
    date: string
    completion: number
    notes?: string
  }
  metrics?: Array<{
    name: string
    value: string
    change: string
  }>
  isExpanded: boolean
  onToggle: () => void
  client: any
  progressBarColor?: string
  onStatusChange?: (id: string, status: "Active" | "On Hold" | "Inactive") => void
  isDemo?: boolean
  onDeleted?: () => void
}

function formatWorkoutDate(dateInput: string | object | undefined): string {
  if (!dateInput) return "No date"

  try {
    // Handle Firestore timestamp objects
    if (typeof dateInput === "object" && dateInput !== null) {
      const timestamp = dateInput as any
      if (timestamp.seconds && timestamp.nanoseconds) {
        const date = new Date(timestamp.seconds * 1000)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
          return "Today"
        } else if (date.toDateString() === yesterday.toDateString()) {
          return "Yesterday"
        } else {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        }
      }
    }

    // Handle string dates
    if (typeof dateInput === "string") {
      const date = new Date(dateInput)
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateInput)
        return "Invalid date"
      }

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) {
        return "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday"
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
    }

    console.warn("Unhandled date format:", dateInput)
    return "Invalid date format"
  } catch (error) {
    console.error("Error formatting date:", error, dateInput)
    return "Error formatting date"
  }
}

export function ClientCard({
  id = "client-1",
  name,
  initials,
  status,
  progress,
  sessions,
  completion,
  notes,
  bgColor,
  textColor,
  lastWorkout,
  metrics,
  isExpanded,
  onToggle,
  client,
  progressBarColor = "#d2ff28",
  onStatusChange,
  isDemo = false,
  onDeleted,
}: ClientCardProps) {
  const { isDemoMode, pathPrefix } = usePathDetection()
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Add state for the latest workout
  const [latestWorkout, setLatestWorkout] = useState(lastWorkout || null)
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false)
  const { user } = useCurrentUser()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Add state for trainer invite code
  const [trainerInviteCode, setTrainerInviteCode] = useState<string>("demo123456")
  const [isLoadingInviteCode, setIsLoadingInviteCode] = useState(false)

  // Function to fetch trainer's universal invite code
  const fetchTrainerInviteCode = async () => {
    console.log("🔍 [RE-INVITE] Fetching trainer invite code...")
    setIsLoadingInviteCode(true)

    try {
      const response = await fetch("/api/auth/me")
      console.log("📡 [RE-INVITE] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const userData = await response.json()
      console.log("👤 [RE-INVITE] User data received:", userData)
      console.log("🎫 [RE-INVITE] universalInviteCode:", userData.universalInviteCode)

      if (userData.universalInviteCode) {
        setTrainerInviteCode(userData.universalInviteCode)
        console.log("✅ [RE-INVITE] Trainer code set to:", userData.universalInviteCode)
      } else {
        console.log("⚠️ [RE-INVITE] No universalInviteCode found, using fallback")
        setTrainerInviteCode("TEMP123")
      }
    } catch (error) {
      console.error("❌ [RE-INVITE] Error fetching trainer code:", error)
      setTrainerInviteCode("ERROR123")
    } finally {
      setIsLoadingInviteCode(false)
    }
  }

  // Handle re-invite button click
  const handleReInviteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("🚀 [RE-INVITE] Re-invite button clicked for client:", name)

    // Fetch the trainer code first
    await fetchTrainerInviteCode()

    // Then open the dialog
    setIsInviteDialogOpen(true)
  }

  // Function to handle status change - only allow Active/Inactive toggle, prevent changes from Deleted
  const handleStatusChange = async (newStatus: "Active" | "Inactive") => {
    console.log(`[ClientCard] Trainer changing status for client ${id} from ${status} to ${newStatus}`)

    // Don't allow status changes from "Deleted" status
    if (status === "Deleted") {
      console.log(`[ClientCard] Cannot change status from "Deleted" - client is archived`)
      return
    }

    // Only allow toggling between Active and Inactive
    if (status !== "Active" && status !== "Inactive") {
      console.log(`[ClientCard] Cannot change status from ${status} - only Active/Inactive can be toggled by trainer`)
      return
    }

    if (!user?.uid) {
      console.error("[ClientCard] Missing user UID for status update. User:", user)
      return
    }

    if (!id && !client?.id) {
      console.error("[ClientCard] Missing client ID for status update. ID:", id, "Client:", client)
      return
    }

    // Use client.id as fallback if id prop is not available
    const clientId = id || client?.id

    try {
      setIsUpdatingStatus(true)
      console.log(`[ClientCard] Trainer updating client ${clientId} status to ${newStatus}`)

      const result = await updateClient(user.uid, clientId, { status: newStatus })

      if (result.success) {
        console.log(`[ClientCard] Successfully updated client ${clientId} status to ${newStatus}`)
        // The real-time listener will update the UI automatically
      } else {
        console.error("[ClientCard] Failed to update client status:", result.error)
      }
    } catch (error) {
      console.error("[ClientCard] Error updating client status:", error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle status tag click
  const handleStatusTagClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log(`[ClientCard] Status tag clicked for client ${id} with status ${status}`)

    // Don't allow clicking on deleted clients
    if (status === "Deleted") {
      return
    }

    // Only allow clicking for Active/Inactive statuses
    if (status === "Active" || status === "Inactive") {
      const newStatus = status === "Active" ? "Inactive" : "Active"
      handleStatusChange(newStatus)
    }
  }

  // Fetch the latest workout when the component mounts or when the client changes
  useEffect(() => {
    async function fetchLatestWorkout() {
      // Skip if we're in demo mode and already have a lastWorkout prop
      if (!client || !client.id || (isDemoMode && lastWorkout)) {
        return
      }

      try {
        setIsLoadingWorkout(true)
        console.log(`Fetching workouts for client: ${id}`)

        // Use the existing API endpoint
        const response = await fetch(`/api/clients/${id}/workouts`)

        if (!response.ok) {
          throw new Error(`Failed to fetch workouts: ${response.status}`)
        }

        const data = await response.json()
        console.log("Workouts data:", data)

        if (data.workouts && data.workouts.length > 0) {
          // Sort by date (newest first) and take the first one
          const sortedWorkouts = [...data.workouts].sort((a, b) => {
            const dateA = new Date(a.startedAt || a.createdAt || 0).getTime()
            const dateB = new Date(b.startedAt || b.createdAt || 0).getTime()
            return dateB - dateA
          })

          const latest = sortedWorkouts[0]
          console.log("Latest workout:", latest)

          // Add console logging to help debug the date issue
          console.log("Latest workout raw date:", latest.startedAt || latest.createdAt || latest.date)
          console.log("Formatted date:", formatWorkoutDate(latest.startedAt || latest.createdAt || latest.date))

          setLatestWorkout({
            name: latest.name || "Unnamed Workout",
            date: formatWorkoutDate(latest.startedAt || latest.createdAt || latest.date),
            completion:
              latest.status === "completed" ? 100 : (latest.progress?.completed / latest.progress?.total) * 100 || 0,
            notes: latest.notes || "",
          })
        } else {
          console.log("No workouts found for client:", id)
        }
      } catch (error) {
        console.error("Error fetching latest workout:", error)
      } finally {
        setIsLoadingWorkout(false)
      }
    }

    // Only fetch if the card is expanded
    if (isExpanded) {
      fetchLatestWorkout()
    }
  }, [client, id, isDemoMode, lastWorkout, isExpanded])

  const statusColor =
    status === "Active"
      ? "bg-green-100 text-green-800"
      : status === "On Hold"
        ? "bg-yellow-100 text-yellow-800"
        : status === "Inactive"
          ? "bg-red-100 text-red-800"
          : status === "Deleted"
            ? "bg-gray-100 text-gray-500"
            : status === "Accepted Invitation"
              ? "bg-blue-100 text-blue-800"
              : status === "Pending"
                ? "bg-gray-100 text-gray-800"
                : "bg-gray-100 text-gray-500"

  // Handle drag start for status tag
  const handleStatusDragStart = (e: React.DragEvent, status: "Active" | "On Hold" | "Inactive") => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "status", status }))
    e.dataTransfer.effectAllowed = "move"
  }

  // Handle drag over for status drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (cardRef.current) {
      cardRef.current.classList.add("border-dashed", "border-2", "border-lime-300")
    }
  }

  // Handle drag leave
  const handleDragLeave = () => {
    if (cardRef.current) {
      cardRef.current.classList.remove("border-dashed", "border-2", "border-lime-300")
    }
  }

  // Handle drop for status
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (cardRef.current) {
      cardRef.current.classList.remove("border-dashed", "border-2", "border-lime-300")
    }

    try {
      const statusData = JSON.parse(e.dataTransfer.getData("application/json"))
      if (statusData.type === "status" && onStatusChange) {
        onStatusChange(id, statusData.status)
      }
    } catch (error) {
      console.error("Error parsing dropped data:", error)
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col w-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Card Header */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="mr-3">
                <ClientInitials initials={initials} />
              </div>
              <div>
                <Link href={`${pathPrefix}/clients/${id}/details-v2`}>
                  <h3 className="font-medium hover:underline">{name}</h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {/* Clickable Status Tag for Active/Inactive clients */}
                  {status === "Active" || status === "Inactive" ? (
                    <button
                      onClick={handleStatusTagClick}
                      disabled={isUpdatingStatus}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-200 ${statusColor} ${
                        isUpdatingStatus
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:opacity-80 cursor-pointer hover:scale-105"
                      }`}
                      title={`Click to change to ${status === "Active" ? "Inactive" : "Active"}`}
                    >
                      {isUpdatingStatus ? (
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        status || "pending"
                      )}
                    </button>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                      {status || "pending"}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {sessions.completed}/{sessions.total} sessions
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-sm font-medium">{progress}%</div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 flex-grow">
            <div className="border-t border-gray-100 pt-3">
              {/* Notes - Only show if there are actual notes */}
              {notes && notes.trim() && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">NOTES</h4>
                  <p className="text-sm">{notes}</p>
                </div>
              )}

              {/* Last Workout - Updated with better UI */}
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-500 mb-1">LAST WORKOUT</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  {isLoadingWorkout ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="h-4 w-4 border-2 border-gray-300 border-t-lime-500 rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading workout...</span>
                    </div>
                  ) : latestWorkout && latestWorkout.name ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Dumbbell className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium">{latestWorkout.name}</p>
                            <p className="text-xs text-gray-500">{latestWorkout.date}</p>
                          </div>
                        </div>
                        <div className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          {Math.round(latestWorkout.completion)}% completed
                        </div>
                      </div>

                      {/* Add notes display */}
                      {latestWorkout.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">NOTES</p>
                          <p className="text-sm text-gray-700">{latestWorkout.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-2">
                      <span className="text-sm text-gray-500">No workouts yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              {metrics && metrics.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">METRICS</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.map((metric, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded-md">
                        <p className="text-xs text-gray-500">{metric.name}</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm font-medium">{metric.value}</p>
                          <span className="text-xs text-green-600">{metric.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex justify-between items-center mt-auto">
          <div className="flex gap-2">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              onClick={() => setIsQuickViewOpen(true)}
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleReInviteClick}
              disabled={isLoadingInviteCode}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              aria-label="Re-invite"
            >
              {isLoadingInviteCode ? (
                <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <Send className="h-4 w-4 text-gray-600" />
              )}
            </button>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label="Delete"
            >
              <Trash className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      <ClientQuickViewModal client={client} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />

      {/* Delete Confirmation Dialog */}
      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        clientId={id}
        clientName={name}
        onDeleted={onDeleted}
      />

      {/* Unified Invitation Dialog - Re-invite Mode */}
      <ClientInvitationDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        client={client}
        inviteCode={trainerInviteCode}
        isReinvite={true}
      />
    </>
  )
}
