"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface FeedbackContextType {
  isOpen: boolean
  openFeedback: () => void
  closeFeedback: () => void
  submitFeedback: (feedback: string, type: string) => Promise<void>
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openFeedback = () => setIsOpen(true)
  const closeFeedback = () => setIsOpen(false)

  const submitFeedback = async (feedback: string, type: string) => {
    try {
      // Mock feedback submission - in real app would send to API
      console.log("Feedback submitted:", { feedback, type })
      await new Promise((resolve) => setTimeout(resolve, 1000))
      closeFeedback()
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }

  return (
    <FeedbackContext.Provider value={{ isOpen, openFeedback, closeFeedback, submitFeedback }}>
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
