"use client"

import { RowGreenCTA, RowWhiteCTA } from "@/components/ui/row-cta-buttons"
import Link from "next/link"
import { useState, useEffect } from "react"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ClientMatchingDialog } from "@/components/clients/client-matching-dialog"

interface PendingUser {
  id: string
  name: string
  email: string
  createdAt: any
  status: string
}

interface ClientRequestsProps {
  trainerId?: string
  hideTitle?: boolean
}

export function ClientRequests({ trainerId, hideTitle = false }: ClientRequestsProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showMatchingDialog, setShowMatchingDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!trainerId) {
      console.log(`[ClientRequests] ❌ No trainerId provided`)
      return
    }

    console.log(`[ClientRequests] 🔄 Setting up real-time listener for trainer: ${trainerId}`)

    // Set up real-time listener for trainer document changes
    const trainerRef = doc(db, "users", trainerId)

    const unsubscribe = onSnapshot(
      trainerRef,
      async (trainerDoc) => {
        console.log(`[ClientRequests] 📡 Real-time update received for trainer: ${trainerId}`)

        if (!trainerDoc.exists()) {
          console.log(`[ClientRequests] ❌ Trainer document not found for ID: ${trainerId}`)
          setPendingUsers([])
          setLoading(false)
          return
        }

        const trainerData = trainerDoc.data()
        const pendingUserIds = trainerData.pendingUsers || []

        console.log(`[ClientRequests] 📋 Trainer data:`, {
          universalInviteCode: trainerData.universalInviteCode,
          pendingUsersCount: pendingUserIds.length,
          pendingUserIds: pendingUserIds,
        })

        if (pendingUserIds.length === 0) {
          console.log(`[ClientRequests] ✅ No pending users found`)
          setPendingUsers([])
          setLoading(false)
          return
        }

        console.log(`[ClientRequests] 🔍 Fetching details for ${pendingUserIds.length} pending users...`)

        // Fetch details for each pending user
        const pendingUsersData = []
        for (const userId of pendingUserIds) {
          try {
            console.log(`[ClientRequests] 👤 Fetching user data for: ${userId}`)
            const userRef = doc(db, "users", userId)
            const userDoc = await getDoc(userRef)

            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log(`[ClientRequests] 📄 User ${userId} data:`, {
                name: userData.name,
                email: userData.email,
                status: userData.status,
                universalInviteCode: userData.universalInviteCode,
                invitedBy: userData.invitedBy,
              })

              if (userData.status === "pending_approval") {
                pendingUsersData.push({
                  id: userId,
                  name: userData.name || userData.firstName || "Unknown User",
                  email: userData.email || "",
                  createdAt: userData.createdAt,
                  status: userData.status,
                })
                console.log(`[ClientRequests] ✅ Added pending user: ${userData.name || userData.email}`)
              } else {
                console.log(`[ClientRequests] ⚠️ User ${userId} has status: ${userData.status} (not pending_approval)`)
              }
            } else {
              console.log(`[ClientRequests] ❌ User document not found for ID: ${userId}`)
            }
          } catch (error) {
            console.error(`[ClientRequests] ❌ Error fetching user ${userId}:`, error)
          }
        }

        // Sort by creation date - newest first
        pendingUsersData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0
          return b.createdAt.toDate() - a.createdAt.toDate()
        })

        console.log(`[ClientRequests] 🎯 Final result: ${pendingUsersData.length} pending users to display`)
        setPendingUsers(pendingUsersData)
        setLoading(false)
      },
      (error) => {
        console.error("[ClientRequests] ❌ Real-time listener error:", error)
        setLoading(false)
      },
    )

    return () => {
      console.log(`[ClientRequests] 🧹 Cleaning up real-time listener for trainer: ${trainerId}`)
      unsubscribe()
    }
  }, [trainerId])

  const handleApprove = async (userId: string) => {
    const user = pendingUsers.find((u) => u.id === userId)
    if (user) {
      setSelectedUser(user)
      setShowMatchingDialog(true)
    }
  }

  const handleApproveWithMatching = async (action: "create_new" | "match_existing", clientId?: string) => {
    if (!selectedUser) return

    try {
      console.log(`[ClientRequests] Approving user with action: ${action}`, { userId: selectedUser.id, clientId })
      const response = await fetch("/api/trainers/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainerId,
          userId: selectedUser.id,
          action: "approve",
          matchToClientId: clientId,
          createNew: action === "create_new",
        }),
      })

      const result = await response.json()
      console.log(`[ClientRequests] Approve response:`, result)

      if (response.ok) {
        console.log(`[ClientRequests] User ${selectedUser.id} approved successfully`)
        setShowMatchingDialog(false)
        setSelectedUser(null)
      } else {
        console.error(`[ClientRequests] Failed to approve user:`, result)
      }
    } catch (error) {
      console.error("[ClientRequests] Error approving user:", error)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      console.log(`[ClientRequests] ❌ Rejecting user: ${userId}`)
      const response = await fetch("/api/trainers/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainerId,
          userId,
          action: "reject",
        }),
      })

      const result = await response.json()
      console.log(`[ClientRequests] 📝 Reject response:`, result)

      if (response.ok) {
        console.log(`[ClientRequests] ✅ User ${userId} rejected successfully`)
      } else {
        console.error(`[ClientRequests] ❌ Failed to reject user:`, result)
      }
    } catch (error) {
      console.error("[ClientRequests] ❌ Error rejecting user:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Determine how many users to show
  const usersToShow = showAll ? pendingUsers : pendingUsers.slice(0, 3)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-500">Loading pending requests...</div>
      </div>
    )
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="space-y-4">
        {!hideTitle && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">New Client Requests</h3>
            <Link href="/clients" className="text-sm text-gray-600 hover:text-gray-800 font-medium underline">
              Go to Clients
            </Link>
          </div>
        )}
        <div className="text-center text-gray-500">No client requests yet. New requests will appear here.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">New Client Requests</h3>
          <Link href="/clients" className="text-sm text-gray-600 hover:text-gray-800 font-medium underline">
            Go to Clients
          </Link>
        </div>
      )}

      {/* Client request cards */}
      {usersToShow.map((user) => (
        <div key={user.id} className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
          {/* User Initials Circle */}
          <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center mr-4">
            <span className="text-base font-medium">{getInitials(user.name)}</span>
          </div>

          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="flex gap-2">
            <RowWhiteCTA className="rounded-md" onClick={() => handleReject(user.id)}>
              Decline
            </RowWhiteCTA>
            <RowGreenCTA onClick={() => handleApprove(user.id)}>Approve</RowGreenCTA>
          </div>
        </div>
      ))}

      {/* View All button at bottom (only if there are more than 3 requests) */}
      {pendingUsers.length > 3 && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium underline"
          >
            {showAll ? "Show Less" : "View All"}
          </button>
        </div>
      )}

      {selectedUser && (
        <ClientMatchingDialog
          isOpen={showMatchingDialog}
          onClose={() => {
            setShowMatchingDialog(false)
            setSelectedUser(null)
          }}
          pendingUser={selectedUser}
          trainerId={trainerId || ""}
          onApprove={handleApproveWithMatching}
        />
      )}
    </div>
  )
}
