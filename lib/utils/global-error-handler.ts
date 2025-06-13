"use client"

import { ErrorType, handleClientError } from "./error-handler"

// Initialize global error handlers
export function initializeGlobalErrorHandlers() {
  if (typeof window === "undefined") {
    return // Skip on server
  }

  // Handle uncaught exceptions
  window.addEventListener("error", (event) => {
    const appError = handleClientError(event.error, {
      component: "GlobalErrorHandler",
      operation: "uncaughtException",
      message: "Uncaught exception",
      errorType: ErrorType.UNKNOWN_ERROR,
    })

    console.error("Uncaught exception:", appError)

    // Prevent default browser error handling
    event.preventDefault()
  })

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const appError = handleClientError(event.reason, {
      component: "GlobalErrorHandler",
      operation: "unhandledRejection",
      message: "Unhandled promise rejection",
      errorType: ErrorType.UNKNOWN_ERROR,
    })

    console.error("Unhandled promise rejection:", appError)

    // Prevent default browser error handling
    event.preventDefault()
  })

  // Log when initialized
  console.log("Global error handlers initialized")
}

// Create a client component to initialize error handlers
export function GlobalErrorHandler() {
  // Initialize on mount
  if (typeof window !== "undefined") {
    initializeGlobalErrorHandlers()
  }

  // This component doesn't render anything
  return null
}
