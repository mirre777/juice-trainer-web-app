"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { UnifiedClientService } from "@/lib/services/unified-client-service"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"
import { ClientInvitationDialog } from "./client-invitation-dialog"
import { DuplicateClientDialog } from "./duplicate-client-dialog"
import type { Client } from "@/types/client"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onAddClient?: (clientId: string) => void
  onGoToClient?: (clientId: string) => void
  isDemo?: boolean
  prefillData?: { name?: string } | null
}

export function AddClientModal({
  isOpen,
  onClose,
  onAddClient,
  onGoToClient,
  isDemo = false,
  prefillData,
}: AddClientModalProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [createdClient, setCreatedClient] = useState<any>(null)
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [trainerInviteCode, setTrainerInviteCode] = useState<string>("")
  const [needsInviteCode, setNeedsInviteCode] = useState(false)
  const [newInviteCode, setNewInviteCode] = useState("")

  // Check if trainer has invite code when modal opens
  useEffect(() => {
    if (isOpen && !isDemo) {
      checkTrainerInviteCode()
    }
  }, [isOpen, isDemo])

  const checkTrainerInviteCode = async () => {
    try {
      console.log("🔍 [ADD CLIENT] Checking trainer invite code...")

      const authResult = await UnifiedAuthService.getCurrentUser()
      if (authResult.success && authResult.user) {
        const code = authResult.user.universalInviteCode || ""
        console.log("✅ [ADD CLIENT] Current invite code:", code)

        if (code && code.trim() !== "") {
          setTrainerInviteCode(code)
          setNeedsInviteCode(false)
        } else {
          console.log("⚠️ [ADD CLIENT] No invite code set, showing setup field")
          setNeedsInviteCode(true)
        }
      } else {
        console.error("❌ [ADD CLIENT] Failed to get current user")
        setNeedsInviteCode(true)
      }
    } catch (error) {
      console.error("💥 [ADD CLIENT] Error checking invite code:", error)
      setNeedsInviteCode(true)
    }
  }

  const updateTrainerInviteCode = async (code: string) => {
    try {
      console.log("📝 [ADD CLIENT] Updating trainer invite code:", code)
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universalInviteCode: code }),
      })

      if (response.ok) {
        console.log("✅ [ADD CLIENT] Invite code updated successfully")
        setTrainerInviteCode(code)
        return true
      } else {
        console.error("❌ [ADD CLIENT] Failed to update invite code")
        return false
      }
    } catch (error) {
      console.error("💥 [ADD CLIENT] Error updating invite code:", error)
      return false
    }
  }

  // Handle prefill data
  useEffect(() => {
    if (prefillData?.name) {
      setName(prefillData.name)
    }
  }, [prefillData])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) newErrors.name = "Name is required"

    // Only require invite code if we're showing the field AND it's empty
    if (needsInviteCode && !newInviteCode.trim()) {
      newErrors.inviteCode = "Invite code is required to send invitations"
    }

    return newErrors
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setNewInviteCode("")
    setErrors({})
    setErrorMessage(null)
    setNeedsInviteCode(false)
    setDuplicateClient(null)
  }

  const createClientDirectly = async (skipDuplicateCheck = false) => {
    console.log("🚀 [ADD CLIENT] Starting client creation...")

    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Demo mode
      if (isDemo) {
        console.log("🎭 [ADD CLIENT] Demo mode")
        const newClient = { id: "demo-client-id", name: name, email: email, phone: phone }
        setCreatedClient(newClient)
        setTrainerInviteCode("DEMO123")
        setShowInviteDialog(true)
        setIsSubmitting(false)
        return
      }

      // Update invite code if needed
      if (needsInviteCode && newInviteCode.trim()) {
        console.log("📝 [ADD CLIENT] Setting new invite code...")
        const codeUpdated = await updateTrainerInviteCode(newInviteCode.toUpperCase())
        if (!codeUpdated) {
          throw new Error("Failed to set invite code")
        }
      }

      // Create client using unified service
      console.log("📝 [ADD CLIENT] Creating client with unified service...")
      const clientResult = await UnifiedClientService.addClient({
        name,
        email: email || "",
        phone: phone || "",
      })

      if (!clientResult.success) {
        console.log("❌ [ADD CLIENT] Failed to create client:", clientResult.error?.message)
        throw new Error(clientResult.error?.message || "Failed to create client")
      }

      console.log("✅ [ADD CLIENT] Client created successfully:", clientResult.clientId)

      // Create client object for invitation dialog
      const newClient = {
        id: clientResult.clientId,
        name: name,
        email: email,
        phone: phone,
      }
      setCreatedClient(newClient)

      // Use the invite code (either existing or newly set)
      const finalInviteCode = needsInviteCode ? newInviteCode.toUpperCase() : trainerInviteCode

      if (finalInviteCode && finalInviteCode.trim() !== "") {
        console.log("🎉 [ADD CLIENT] Showing invite dialog with code:", finalInviteCode)
        setShowInviteDialog(true)
        onClose() // Close add client modal
      } else {
        console.log("❌ [ADD CLIENT] No invite code available")
        onClose()
        toast({
          title: "Client Added",
          description: "Client added successfully! Set up your invite code in Settings to send invitations.",
        })
      }

      // Callback
      if (onAddClient && clientResult.clientId) {
        onAddClient(clientResult.clientId)
      }
    } catch (error: any) {
      console.error("💥 [ADD CLIENT] Error:", error)
      setErrorMessage(error.message || "Failed to add client")
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    await createClientDirectly(false)
  }

  const handleCreateAnyway = async () => {
    setShowDuplicateDialog(false)
    await createClientDirectly(true) // Skip duplicate check
  }

  const handleGoToClient = () => {
    if (duplicateClient && onGoToClient) {
      setShowDuplicateDialog(false)
      onClose()
      onGoToClient(duplicateClient.id)
    }
  }

  const handleCloseInviteDialog = () => {
    console.log("🔒 [ADD CLIENT] Closing invite dialog")
    setShowInviteDialog(false)
    resetForm()
  }

  const handleCloseDuplicateDialog = () => {
    setShowDuplicateDialog(false)
    setDuplicateClient(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Client</DialogTitle>
            <DialogDescription className="text-sm">
              Enter your client's information to create their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-sm">
                Full Name
              </Label>
              <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-sm">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Setup Invite Code Field */}
            {needsInviteCode && (
              <div className="grid gap-2 pt-4 border-t border-gray-200">
                <Label htmlFor="inviteCode" className="text-sm">
                  Set Your Invite Code
                </Label>
                <Input
                  id="inviteCode"
                  value={newInviteCode}
                  onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code (max 20 characters)"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500">
                  You need an invite code to send invitations to clients. You can also set this later in Settings.
                </p>
                {errors.inviteCode && <p className="text-sm text-red-500">{errors.inviteCode}</p>}
              </div>
            )}

            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Client"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-right mt-2">You'll get an invitation link after adding the client</p>
        </DialogContent>
      </Dialog>

      {/* Duplicate client dialog */}
      {showDuplicateDialog && duplicateClient && (
        <DuplicateClientDialog
          isOpen={showDuplicateDialog}
          onClose={handleCloseDuplicateDialog}
          existingClient={duplicateClient}
          newClientEmail={email}
          onCreateAnyway={handleCreateAnyway}
          onGoToClient={handleGoToClient}
        />
      )}

      {/* Invite dialog */}
      {showInviteDialog && createdClient && (trainerInviteCode || newInviteCode) && (
        <ClientInvitationDialog
          isOpen={showInviteDialog}
          onClose={handleCloseInviteDialog}
          client={createdClient}
          inviteCode={needsInviteCode ? newInviteCode.toUpperCase() : trainerInviteCode}
          isReinvite={false}
        />
      )}
    </>
  )
}
