"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface FeedbackData {
  type: "bug" | "feature" | "general"
  message: string
  email?: string
  page?: string
}

interface FeedbackContextType {
  isOpen: boolean
  isSubmitting: boolean
  openFeedback: () => void
  closeFeedback: () => void
  submitFeedback: (data: FeedbackData) => Promise<void>
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openFeedback = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeFeedback = useCallback(() => {
    setIsOpen(false)
  }, [])

  const submitFeedback = useCallback(async (data: FeedbackData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Log feedback data (in real app, this would be sent to an API)
      console.log("Feedback submitted:", {
        ...data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      })

      // Store in localStorage for demo purposes
      const existingFeedback = JSON.parse(localStorage.getItem("feedback") || "[]")
      existingFeedback.push({
        ...data,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      })
      localStorage.setItem("feedback", JSON.stringify(existingFeedback))

      setIsOpen(false)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return (
    <FeedbackContext.Provider
      value={{
        isOpen,
        isSubmitting,
        openFeedback,
        closeFeedback,
        submitFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export default FeedbackProvider
