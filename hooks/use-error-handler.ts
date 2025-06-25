"use client"

import { useState, useCallback } from "react"
import type { AppError } from "@/lib/utils/error-handler"

type ErrorHandler = {
  error: AppError | null
  setError: (error: AppError | null) => void
  clearError: () => void
}

const useErrorHandler = (): ErrorHandler => {
  const [error, setError] = useState<AppError | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    setError,
    clearError,
  }
}

export default useErrorHandler
