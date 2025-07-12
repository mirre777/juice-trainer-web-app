export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  NAVIGATION_ERROR = "NAVIGATION_ERROR",
  API_MISSING_PARAMS = "API_MISSING_PARAMS",
  API_VALIDATION_FAILED = "API_VALIDATION_FAILED",
  DB_READ_FAILED = "DB_READ_FAILED",
  DB_WRITE_FAILED = "DB_WRITE_FAILED",
  DB_DELETE_FAILED = "DB_DELETE_FAILED",
  DB_DOCUMENT_NOT_FOUND = "DB_DOCUMENT_NOT_FOUND",
  DB_FIELD_MISSING = "DB_FIELD_MISSING",
  AUTH_ERROR = "AUTH_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
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

// Add the missing client-side error handler
export function handleClientError(
  error: unknown,
  context: {
    component: string
    operation: string
    message: string
    errorType?: ErrorType
  },
): AppError {
  console.error(`[${context.component}:${context.operation}] ${context.message}:`, error)

  if (error instanceof AppError) {
    return error
  }

  return new AppError({
    message: context.message,
    errorType: context.errorType || ErrorType.UNKNOWN_ERROR,
    originalError: error instanceof Error ? error : new Error(String(error)),
    context,
  })
}

// Add the missing createError function
export function createError(
  errorType: ErrorType,
  originalError: unknown,
  context: Record<string, any>,
  message: string,
): AppError {
  return new AppError({
    message,
    errorType,
    originalError: originalError instanceof Error ? originalError : new Error(String(originalError)),
    context,
  })
}

// Add the missing logError function
export function logError(error: AppError): void {
  console.error(`[${error.errorType}] ${error.message}`, {
    context: error.context,
    originalError: error.originalError,
    stack: error.stack,
  })
}

// Add the missing tryCatch function
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorType: ErrorType,
  context: Record<string, any>,
): Promise<[T | null, AppError | null]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    const appError = createError(errorType, error, context, `Operation failed: ${errorType}`)
    return [null, appError]
  }
}

export function tryCatchSync<T>(fn: () => T, errorHandler?: (error: unknown) => T): T {
  try {
    return fn()
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error)
    }
    throw error
  }
}
