"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface FeedbackData {
  type: "bug" | "feature" | "general"
  message: string
  email?: string
  page?: string
}

interface FeedbackContextType {
  isOpen: boolean
  openFeedback: () => void
  closeFeedback: () => void
  submitFeedback: (data: FeedbackData) => Promise<void>
  isSubmitting: boolean
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openFeedback = () => setIsOpen(true)
  const closeFeedback = () => setIsOpen(false)

  const submitFeedback = async (data: FeedbackData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Feedback submitted:", data)
      closeFeedback()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FeedbackContext.Provider
      value={{
        isOpen,
        openFeedback,
        closeFeedback,
        submitFeedback,
        isSubmitting,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}

export default FeedbackProvider
