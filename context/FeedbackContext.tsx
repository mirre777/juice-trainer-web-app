"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface Feedback {
  id: string
  type: "bug" | "feature" | "general"
  message: string
  email?: string
  timestamp: Date
  status: "pending" | "submitted" | "error"
}

interface FeedbackContextType {
  feedbacks: Feedback[]
  isSubmitting: boolean
  submitFeedback: (feedback: Omit<Feedback, "id" | "timestamp" | "status">) => Promise<void>
  clearFeedbacks: () => void
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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitFeedback = useCallback(async (feedbackData: Omit<Feedback, "id" | "timestamp" | "status">) => {
    setIsSubmitting(true)

    const newFeedback: Feedback = {
      ...feedbackData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      status: "pending",
    }

    setFeedbacks((prev) => [...prev, newFeedback])

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update status to submitted
      setFeedbacks((prev) => prev.map((f) => (f.id === newFeedback.id ? { ...f, status: "submitted" as const } : f)))

      console.log("Feedback submitted:", newFeedback)
    } catch (error) {
      // Update status to error
      setFeedbacks((prev) => prev.map((f) => (f.id === newFeedback.id ? { ...f, status: "error" as const } : f)))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const clearFeedbacks = useCallback(() => {
    setFeedbacks([])
  }, [])

  return (
    <FeedbackContext.Provider
      value={{
        feedbacks,
        isSubmitting,
        submitFeedback,
        clearFeedbacks,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export default FeedbackProvider
