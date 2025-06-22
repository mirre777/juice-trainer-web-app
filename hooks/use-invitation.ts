"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { processInvitation, checkExistingClientProfile, replaceTemporaryClient } from "@/lib/firebase/client-service"
import { AppError, ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useInvitation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams?.get("invite")

  const [isProcessing, setIsProcessing] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Process invitation after successful signup/login
  const processUserInvitation = async (userId: string) => {
    if (!inviteCode) return false

    setIsProcessing(true)
    setInviteError(null)

    try {
      if (!userId) {
        throw new AppError({
          message: "User ID is required to process invitation",
          errorType: ErrorType.VALIDATION_ERROR,
        })
      }

      // Process the invitation
      const result = await processInvitation(inviteCode, userId)

      if (result.success) {
        // Check if user already has a client profile with this trainer
        if (result.trainerId) {
          const existingClientId = await checkExistingClientProfile(userId, result.trainerId)

          if (existingClientId && result.clientId) {
            // User already has a client profile, replace the temporary one
            await replaceTemporaryClient(result.clientId, userId, result.trainerId)
          }
        }

        return true
      } else {
        setInviteError("Invalid or expired invitation")
        return false
      }
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useInvitation",
        operation: "processUserInvitation",
        message: "Failed to process invitation",
        errorType: ErrorType.INVITATION_ERROR,
      })

      console.error("Error processing invitation:", appError)
      setInviteError(appError.message)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    hasInvitation: !!inviteCode,
    inviteCode,
    isProcessing,
    inviteError,
    processUserInvitation,
  }
}
