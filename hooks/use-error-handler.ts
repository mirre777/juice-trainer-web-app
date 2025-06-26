"use client"

import { useState, useCallback } from "react"
import { type AppError, handleClientError } from "@/lib/utils/error-handler"
import { useToast } from "@/hooks/use-toast"

interface ErrorHandlerOptions {
  component: string
  showToast?: boolean
  defaultErrorMessage?: string
}

export function useErrorHandler(options: ErrorHandlerOptions) {
  const [error, setError] = useState<AppError | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const handleError = useCallback(
    (err: unknown, operation: string) => {
      const appError = handleClientError(err, {
        component: options.component,
        operation,
        message: options.defaultErrorMessage || "An error occurred",
      })

      setError(appError)

      if (options.showToast !== false) {
        toast.error({
          title: "Error",
          description: appError.message,
        })
      }

      return appError
    },
    [options.component, options.defaultErrorMessage, options.showToast, toast],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithErrorHandling = useCallback(
    async <T,>(fn: () => Promise<T>, operation: string): Promise<T | undefined> => {
      try {
        setLoading(true)
        clearError()
        const result = await fn()
        return result
      } catch (err) {
        handleError(err, operation)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [handleError, clearError],
  )

  return {
    error,
    loading,
    handleError,
    clearError,
    executeWithErrorHandling,
  }
}
