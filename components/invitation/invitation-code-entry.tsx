"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { processInvitation } from "@/lib/firebase/client-service"
import { useToast } from "@/hooks/use-toast"

interface InvitationCodeEntryProps {
  onSuccess?: (trainerId: string, clientId: string) => void
  userId: string
}

export function InvitationCodeEntry({ onSuccess, userId }: InvitationCodeEntryProps) {
  const [inviteCode, setInviteCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteCode.trim()) {
      setError("Please enter an invitation code")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await processInvitation(inviteCode.trim(), userId)

      if (result.success && result.trainerId && result.clientId) {
        toast.success({
          title: "Success!",
          description: "You've been connected with your trainer.",
        })

        if (onSuccess) {
          onSuccess(result.trainerId, result.clientId)
        }
      } else {
        setError("Invalid or expired invitation code. Please check and try again.")
      }
    } catch (err) {
      console.error("Error processing invitation:", err)
      setError("Failed to process invitation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Enter Invitation Code</h2>
      <p className="text-gray-600 mb-6">
        If you received an invitation code from your trainer, enter it below to connect.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invitation code"
            className="text-center font-mono text-lg py-6"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <Button
          type="submit"
          className="w-full bg-lime-400 text-black hover:bg-lime-500 py-6 text-lg font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Connecting..." : "Connect with Trainer"}
        </Button>
      </form>
    </div>
  )
}
