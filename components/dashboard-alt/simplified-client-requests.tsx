"use client"

import { RowGreenCTA, RowWhiteCTA } from "@/components/ui/row-cta-buttons"
import { useState, useEffect } from "react"
import { onSnapshot, collection, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

interface PendingUser {
  id: string
  name: string
  email: string
  createdAt: any
}

interface SimplifiedClientRequestsProps {
  trainerId?: string
}

export function SimplifiedClientRequests({ trainerId }: SimplifiedClientRequestsProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!trainerId) return

    // Simple query - get all users pending approval from this trainer
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("pendingApprovalFrom", "==", trainerId), where("status", "==", "pending_approval"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "Unknown User",
        email: doc.data().email || "",
        createdAt: doc.data().createdAt,
      }))

      setPendingUsers(users)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [trainerId])

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId,
          userId,
          action: "approve",
        }),
      })

      if (!response.ok) {
        console.error("Failed to approve user")
      }
    } catch (error) {
      console.error("Error approving user:", error)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId,
          userId,
          action: "reject",
        }),
      })

      if (!response.ok) {
        console.error("Failed to reject user")
      }
    } catch (error) {
      console.error("Error rejecting user:", error)
    }
  }

  if (loading) {
    return <div>Loading requests...</div>
  }

  if (pendingUsers.length === 0) {
    return <div>No pending requests</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">New Client Requests</h3>

      {pendingUsers.map((user) => (
        <div key={user.id} className="flex items-center p-4 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="flex gap-2">
            <RowWhiteCTA onClick={() => handleReject(user.id)}>Decline</RowWhiteCTA>
            <RowGreenCTA onClick={() => handleApprove(user.id)}>Approve</RowGreenCTA>
          </div>
        </div>
      ))}
    </div>
  )
}
