export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  NAVIGATION_ERROR = "NAVIGATION_ERROR",
}

export interface AppErrorOptions {
  message: string
  errorType: ErrorType
  originalError?: Error
  context?: Record<string, any>
}

export class AppError extends Error {
  public readonly errorType: ErrorType
  public readonly originalError?: Error
  public readonly context?: Record<string, any>

  constructor(options: AppErrorOptions) {
    super(options.message)
    this.name = "AppError"
    this.errorType = options.errorType
    this.originalError = options.originalError
    this.context = options.context
  }
}

export function handleServerError(
  error: unknown,
  context: {
    service: string
    operation: string
    message: string
    errorType: ErrorType
  },
): AppError {
  console.error(`[${context.service}:${context.operation}] ${context.message}:`, error)

  if (error instanceof AppError) {
    return error
  }

  return new AppError({
    message: context.message,
    errorType: context.errorType,
    originalError: error instanceof Error ? error : new Error(String(error)),
    context,
  })
}

export function tryCatch<T>(fn: () => T, errorHandler?: (error: unknown) => T): T {
  try {
    return fn()
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error)
    }
    throw error
  }
}
