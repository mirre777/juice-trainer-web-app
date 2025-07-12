// Error types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  context?: Record<string, any>
}

export interface ErrorContext {
  userId?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

// Create a standardized error
export function createError(message: string, code?: string, statusCode?: number, context?: ErrorContext): AppError {
  const error = new Error(message) as AppError
  error.code = code
  error.statusCode = statusCode
  error.context = context
  return error
}

// Log error with context
export function logError(error: Error | AppError, context?: ErrorContext): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: (error as AppError).code,
    statusCode: (error as AppError).statusCode,
    context: {
      ...(error as AppError).context,
      ...context,
    },
    timestamp: new Date().toISOString(),
  }

  console.error("[ERROR]", errorInfo)
}

// Handle client-side errors
export function handleClientError(error: Error | AppError, context?: ErrorContext): void {
  logError(error, context)

  // In development, show more details
  if (process.env.NODE_ENV === "development") {
    console.error("Client Error Details:", {
      error,
      context,
      stack: error.stack,
    })
  }
}

// Try-catch wrapper with error handling
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    const appError =
      error instanceof Error
        ? createError(error.message, "UNKNOWN_ERROR", 500, context)
        : createError("Unknown error occurred", "UNKNOWN_ERROR", 500, context)

    logError(appError, context)
    return { error: appError }
  }
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandler(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      handleClientError(event.error, {
        component: "GlobalErrorHandler",
        action: "unhandled_error",
      })
    })

    window.addEventListener("unhandledrejection", (event) => {
      handleClientError(new Error(event.reason), {
        component: "GlobalErrorHandler",
        action: "unhandled_promise_rejection",
      })
    })
  }
}
