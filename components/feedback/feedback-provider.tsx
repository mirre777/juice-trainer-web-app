"use client"

import type React from "react"
import { createContext, useState, useContext, type ReactNode, useCallback } from "react"

import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "react-i18next"
import { trackEvent } from "@/lib/utils/matomo"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api"
import type { AppError } from "@/lib/utils/error-handler"

interface FeedbackContextProps {
  isFeedbackModalOpen: boolean
  openFeedbackModal: () => void
  closeFeedbackModal: () => void
  submitFeedback: (feedback: string) => Promise<void>
  isSubmitting: boolean
}

const FeedbackContext = createContext<FeedbackContextProps | undefined>(undefined)

interface FeedbackProviderProps {
  children: ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()
  const { data: session } = useSession()

  const openFeedbackModal = useCallback(() => {
    setIsFeedbackModalOpen(true)
  }, [])

  const closeFeedbackModal = useCallback(() => {
    setIsFeedbackModalOpen(false)
  }, [])

  const submitFeedback = useCallback(
    async (feedback: string) => {
      setIsSubmitting(true)
      try {
        await api.post("/api/feedback", { feedback })
        toast({
          title: t("feedback.success"),
          description: t("feedback.success_description"),
        })
        trackEvent({
          category: "Feedback",
          action: "Submit Feedback",
          name: "Feedback Submitted",
        })
        closeFeedbackModal()
      } catch (error) {
        const appError = error as AppError
        toast({
          variant: "destructive",
          title: t("feedback.error"),
          description: appError.message || t("feedback.error_description"),
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [closeFeedbackModal, t, toast, session],
  )

  return (
    <FeedbackContext.Provider
      value={{
        isFeedbackModalOpen,
        openFeedbackModal,
        closeFeedbackModal,
        submitFeedback,
        isSubmitting,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export const useFeedback = (): FeedbackContextProps => {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}
