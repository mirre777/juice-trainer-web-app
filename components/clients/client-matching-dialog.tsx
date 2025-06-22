"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface PendingClient {
  id: string
  name: string
  email: string
  goal: string
  notes: string
}

interface PendingUser {
  id: string
  name: string
  email: string
}

interface ClientMatchingDialogProps {
  isOpen: boolean
  onClose: () => void
  pendingUser: PendingUser
  trainerId: string
  onApprove: (action: "create_new" | "match_existing", clientId?: string) => void
}

export function ClientMatchingDialog({
  isOpen,
  onClose,
  pendingUser,
  trainerId,
  onApprove,
}: ClientMatchingDialogProps) {
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState<"create_new" | "match_existing">("create_new")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && trainerId) {
      fetchPendingClients()
    }
  }, [isOpen, trainerId])

  const fetchPendingClients = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients?trainerId=${trainerId}&status=Pending`)
      const data = await response.json()

      if (response.ok) {
        setPendingClients(data.clients || [])
      } else {
        console.error("Failed to fetch pending clients:", data.error)
        setPendingClients([])
      }
    } catch (error) {
      console.error("Error fetching pending clients:", error)
      setPendingClients([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (selectedAction === "match_existing" && !selectedClientId) {
      return // Don't proceed if no client selected
    }

    setSubmitting(true)
    try {
      await onApprove(selectedAction, selectedClientId || undefined)
      onClose()
    } catch (error) {
      console.error("Error approving user:", error)
    } finally {
      setSubmitting(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Approve Client Request</DialogTitle>
          <DialogDescription>
            How would you like to handle <strong>{pendingUser.name}</strong> ({pendingUser.email})?
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <RadioGroup value={selectedAction} onValueChange={(value) => setSelectedAction(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create_new" id="create_new" />
              <Label htmlFor="create_new">Create new client profile</Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="match_existing" id="match_existing" />
              <Label htmlFor="match_existing">Match to existing client</Label>
            </div>
          </RadioGroup>

          {selectedAction === "match_existing" && (
            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Loading pending clients...</span>
                </div>
              ) : pendingClients.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No pending clients found. You can create a new client profile instead.
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select client to match:</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    <RadioGroup value={selectedClientId} onValueChange={setSelectedClientId}>
                      {pendingClients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <RadioGroupItem value={client.id} id={client.id} />
                          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">{getInitials(client.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={client.id} className="font-medium cursor-pointer block truncate">
                              {client.name}
                            </Label>
                            {client.email && <p className="text-xs text-gray-500 truncate">{client.email}</p>}
                            {client.goal && <p className="text-xs text-gray-600 truncate">Goal: {client.goal}</p>}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={submitting || (selectedAction === "match_existing" && !selectedClientId)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Approving...
              </>
            ) : (
              "Approve"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
