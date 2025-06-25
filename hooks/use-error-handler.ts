"use client"

import { type AppError, createError, logError, type ErrorType } from "@/lib/utils/error-handler"

import { useState, useCallback } from "react"

type ErrorHandler = {
  error: AppError | null
  setError: (error: AppError | null) => void
  clearError: () => void
  handleError: (error: Error | any, errorType?: ErrorType, message?: string) => void
}

const useErrorHandler = (): ErrorHandler => {
  const [error, setError] = useState<AppError | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: Error | any, errorType?: ErrorType, message?: string) => {
    const appError = createError(error, errorType, message)
    logError(appError)
    setError(appError)
  }, [])

  return {
    error,
    setError,
    clearError,
    handleError,
  }
}

export default useErrorHandler
