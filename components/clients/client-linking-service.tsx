"use client"

import { useEffect } from "react"
import { collection, query, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { linkPendingClientsWithUsers } from "@/lib/firebase/client-service"
import { useCurrentUser } from "@/hooks/use-current-user"

/**
 * This component sets up real-time listeners to automatically link
 * pending clients with users who have matching invitation codes.
 *
 * It should be mounted in a layout component that's always present
 * when a trainer is logged in.
 */
export function ClientLinkingService() {
  const { user } = useCurrentUser()

  useEffect(() => {
    if (!user?.uid) return

    console.log("[ClientLinkingService] Setting up listeners for trainer:", user.uid)

    // Run the linking process immediately on mount
    linkPendingClientsWithUsers(user.uid)
      .then(() => {
        console.log("[ClientLinkingService] Completed initial linking process")
      })
      .catch((error) => {
        console.error("[ClientLinkingService] Error in initial linking:", error)
      })

    // Set up a listener for new users with invitation codes
    const usersRef = collection(db, "users")
    // Use a different query approach to ensure we catch all relevant users
    const usersQuery = query(usersRef)

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const relevantChanges = snapshot.docChanges().filter((change) => {
          const data = change.doc.data()
          return data.inviteCode && typeof data.inviteCode === "string" && data.inviteCode.length > 0
        })

        if (relevantChanges.length > 0) {
          console.log("[ClientLinkingService] Detected changes in users with invitation codes")
          console.log(
            "[ClientLinkingService] Relevant changes:",
            relevantChanges.map((change) => ({
              type: change.type,
              id: change.doc.id,
              inviteCode: change.doc.data().inviteCode,
            })),
          )

          // Run the linking process for this trainer
          linkPendingClientsWithUsers(user.uid)
            .then(() => {
              console.log("[ClientLinkingService] Completed linking process after changes")
            })
            .catch((error) => {
              console.error("[ClientLinkingService] Error linking clients after changes:", error)
            })
        }
      },
      (error) => {
        console.error("[ClientLinkingService] Error in users listener:", error)
      },
    )

    // Clean up the listener when the component unmounts
    return () => {
      console.log("[ClientLinkingService] Cleaning up listeners")
      unsubscribe()
    }
  }, [user?.uid])

  // This component doesn't render anything
  return null
}
