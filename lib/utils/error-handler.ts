export enum ErrorType {
  // API errors
  API_MISSING_PARAMS = "API_MISSING_PARAMS",
  API_INVALID_PARAMS = "API_INVALID_PARAMS",
  API_RATE_LIMIT = "API_RATE_LIMIT",
  API_UNAUTHORIZED = "API_UNAUTHORIZED",
  API_FORBIDDEN = "API_FORBIDDEN",
  API_NOT_FOUND = "API_NOT_FOUND",
  API_SERVER_ERROR = "API_SERVER_ERROR",
  API_TIMEOUT = "API_TIMEOUT",
  API_NETWORK_ERROR = "API_NETWORK_ERROR",

  // Database errors
  DB_CONNECTION_FAILED = "DB_CONNECTION_FAILED",
  DB_READ_FAILED = "DB_READ_FAILED",
  DB_WRITE_FAILED = "DB_WRITE_FAILED",
  DB_DELETE_FAILED = "DB_DELETE_FAILED",
  DB_DOCUMENT_NOT_FOUND = "DB_DOCUMENT_NOT_FOUND",
  DB_QUERY_FAILED = "DB_QUERY_FAILED",
  DB_TRANSACTION_FAILED = "DB_TRANSACTION_FAILED",

  // Authentication errors
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID",
  AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND",
  AUTH_EMAIL_IN_USE = "AUTH_EMAIL_IN_USE",
  AUTH_WEAK_PASSWORD = "AUTH_WEAK_PASSWORD",
  AUTH_PROVIDER_ERROR = "AUTH_PROVIDER_ERROR",

  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_STATE = "INVALID_STATE",
  INVALID_OPERATION = "INVALID_OPERATION",

  // File errors
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_INVALID_TYPE = "FILE_INVALID_TYPE",
  FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED",
  FILE_DOWNLOAD_FAILED = "FILE_DOWNLOAD_FAILED",

  // External service errors
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  PAYMENT_PROCESSING_ERROR = "PAYMENT_PROCESSING_ERROR",
  EMAIL_SENDING_ERROR = "EMAIL_SENDING_ERROR",
  SMS_SENDING_ERROR = "SMS_SENDING_ERROR",

  // Invitation errors
  INVITATION_ERROR = "INVITATION_ERROR",

  // UI errors
  UI_ERROR = "UI_ERROR",

  // Configuration errors
  CONFIG_ERROR = "CONFIG_ERROR",

  // Navigation errors
  NAVIGATION_ERROR = "NAVIGATION_ERROR",

  // Initialization errors
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",

  // Unknown/unexpected errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500)
  }

  return new AppError("An unknown error occurred", 500)
}

export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export function logError(error: AppError): void {
  console.error("APP ERROR:", {
    message: error.message,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    stack: error.stack,
  })
}

export function handleClientError(
  error: any,
  options: { component: string; operation: string; message: string; errorType: ErrorType },
): AppError {
  const appError = new AppError(
    options.message,
    options.errorType === ErrorType.API_INVALID_PARAMS
      ? 400
      : options.errorType === ErrorType.API_UNAUTHORIZED
        ? 401
        : options.errorType === ErrorType.API_FORBIDDEN
          ? 403
          : options.errorType === ErrorType.API_NOT_FOUND
            ? 404
            : 500,
    true,
  )

  logError(appError)
  return appError
}

export function handleServerError(
  error: any,
  options: { service: string; operation: string; message: string; errorType: ErrorType; logOnly?: boolean },
): AppError {
  const appError = new AppError(
    options.message,
    options.errorType === ErrorType.API_INVALID_PARAMS
      ? 400
      : options.errorType === ErrorType.API_UNAUTHORIZED
        ? 401
        : options.errorType === ErrorType.API_FORBIDDEN
          ? 403
          : options.errorType === ErrorType.API_NOT_FOUND
            ? 404
            : 500,
    true,
  )

  if (!options.logOnly) {
    logError(appError)
  }

  return appError
}

export function handleApiError(
  error: any,
  options: { route: string; requestId?: string },
): { error: AppError; statusCode: number } {
  const appError = new AppError("API request failed", error instanceof AppError ? error.statusCode : 500, true)

  logError(appError)

  let statusCode = 500 // Default server error
  switch (appError.statusCode) {
    case 400:
      statusCode = 400
      break
    case 401:
      statusCode = 401
      break
    case 403:
      statusCode = 403
      break
    case 404:
      statusCode = 404
      break
  }

  return { error: appError, statusCode }
}

export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  metadata: any = {},
): Promise<[T | null, AppError | null]> {
  try {
    const result = await operation()
    return [result, null]
  } catch (error) {
    const appError = handleError(error)
    logError(appError)
    return [null, appError]
  }
}

export function logAuditEvent(eventData: any): void {
  // Audit logging disabled - this is a no-op function
  // Previously would have written to the audit_logs collection
  console.log("Audit logging disabled:", eventData)
  return
}

export type { ErrorType }
