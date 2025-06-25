"use client"

import type React from "react"
import { createContext, useContext, type ReactNode, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { AppError } from "@/lib/utils/error-handler"

interface FeedbackContextProps {
  showSuccessFeedback: (message: string) => void
  showErrorFeedback: (error: AppError | Error | string) => void
}

const FeedbackContext = createContext<FeedbackContextProps | undefined>(undefined)

interface FeedbackProviderProps {
  children: ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const { toast } = useToast()

  const showSuccessFeedback = useCallback(
    (message: string) => {
      toast({
        variant: "success",
        title: "Success",
        description: message,
      })
    },
    [toast],
  )

  const showErrorFeedback = useCallback(
    (error: AppError | Error | string) => {
      let message: string

      if (typeof error === "string") {
        message = error
      } else if ((error as AppError).message) {
        message = (error as AppError).message
      } else {
        message = error.toString()
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      })
    },
    [toast],
  )

  return (
    <FeedbackContext.Provider value={{ showSuccessFeedback, showErrorFeedback }}>{children}</FeedbackContext.Provider>
  )
}

export const useFeedback = (): FeedbackContextProps => {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}
