"use client"

import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { type AppError, ErrorType, logError } from "@/lib/utils/error-handler" // Corrected import

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(
    (error: any, context: { component: string; operation: string; message?: string; errorType?: ErrorType }) => {
      const defaultMessage = `An error occurred during ${context.operation} in ${context.component}.`
      const errorMessage = context.message || error?.message || defaultMessage
      const errorType = context.errorType || ErrorType.UNKNOWN_ERROR

      const appError: AppError = {
        type: errorType,
        message: errorMessage,
        originalError: error,
        metadata: { component: context.component, operation: context.operation },
        timestamp: new Date(),
      }

      logError(appError)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return appError
    },
    [toast],
  )

  return { handleError }
}
