"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface FeedbackData {
  type: "bug" | "feature" | "general"
  message: string
  email?: string
  rating?: number
}

interface FeedbackContextType {
  isOpen: boolean
  openFeedback: () => void
  closeFeedback: () => void
  submitFeedback: (data: FeedbackData) => Promise<void>
  isSubmitting: boolean
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}

interface FeedbackProviderProps {
  children: ReactNode
}

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openFeedback = () => setIsOpen(true)
  const closeFeedback = () => setIsOpen(false)

  const submitFeedback = async (data: FeedbackData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, you would send this to your feedback API
      console.log("Feedback submitted:", data)

      // Close the feedback modal after successful submission
      closeFeedback()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const value: FeedbackContextType = {
    isOpen,
    openFeedback,
    closeFeedback,
    submitFeedback,
    isSubmitting,
  }

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
}
