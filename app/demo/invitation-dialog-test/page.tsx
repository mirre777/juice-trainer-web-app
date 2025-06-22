"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ClientInvitationDialog } from "@/components/clients/client-invitation-dialog"
import { PageLayout } from "@/components/shared/page-layout"

export default function InvitationDialogTestPage() {
  const [showInitialInvite, setShowInitialInvite] = useState(false)
  const [showReinvite, setShowReinvite] = useState(false)

  // Sample client data for testing
  const sampleClient = {
    id: "client-123",
    name: "John Doe",
    email: "john@example.com",
    inviteCode: "invite-123456",
    status: "Active",
    progress: 75,
    sessions: { completed: 5, total: 10 },
    completion: 50,
    notes: "Client notes here",
    bgColor: "#f3f4f6",
    textColor: "#111827",
  }

  return (
    <PageLayout title="Invitation Dialog Test" description="Test both modes of the unified invitation dialog">
      <div className="space-y-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Initial Invite Mode</h2>
          <p className="mb-4 text-gray-600">
            This demonstrates the dialog when inviting a client for the first time. It shows the invitation link and a
            copy button.
          </p>
          <Button onClick={() => setShowInitialInvite(true)}>Show Initial Invite Dialog</Button>

          <ClientInvitationDialog
            isOpen={showInitialInvite}
            onClose={() => setShowInitialInvite(false)}
            client={sampleClient}
            inviteCode={sampleClient.inviteCode}
            isReinvite={false}
          />
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Re-invite Mode</h2>
          <p className="mb-4 text-gray-600">
            This demonstrates the dialog when re-inviting an existing client. It shows the invitation link, a copy
            button, and a "Mark as Resent" button.
          </p>
          <Button onClick={() => setShowReinvite(true)}>Show Re-invite Dialog</Button>

          <ClientInvitationDialog
            isOpen={showReinvite}
            onClose={() => setShowReinvite(false)}
            client={sampleClient}
            inviteCode={sampleClient.inviteCode}
            isReinvite={true}
            onInviteSent={() => {
              console.log("Invitation resent to client:", sampleClient.id)
            }}
          />
        </div>
      </div>
    </PageLayout>
  )
}
