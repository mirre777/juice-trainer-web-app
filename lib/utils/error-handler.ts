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
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",

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

export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
  metadata?: any
  timestamp?: Date
  statusCode?: number
  stack?: string
}

export function createError(
  type: ErrorType,
  originalError: any = null,
  metadata: any = {},
  message?: string,
): AppError {
  const errorMessage = message || originalError?.message || `An error of type ${type} occurred`

  const error: AppError = {
    type,
    message: errorMessage,
    originalError,
    metadata,
    timestamp: new Date(),
  }

  return error
}

export function logError(error: AppError): void {
  console.error("APP ERROR:", {
    type: error.type,
    message: error.message,
    metadata: error.metadata,
    timestamp: error.timestamp,
    originalError: error.originalError,
  })
}

export function handleClientError(
  error: any,
  options: { component: string; operation: string; message: string; errorType: ErrorType },
): AppError {
  const appError = createError(
    options.errorType,
    error,
    {
      component: options.component,
      operation: options.operation,
    },
    options.message,
  )

  logError(appError)
  return appError
}

export function handleServerError(
  error: any,
  options: { service: string; operation: string; message: string; errorType: ErrorType; logOnly?: boolean },
): AppError {
  const appError = createError(
    options.errorType,
    error,
    {
      service: options.service,
      operation: options.operation,
    },
    options.message,
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
  const appError = createError(
    ErrorType.API_SERVER_ERROR,
    error,
    {
      route: options.route,
      requestId: options.requestId,
    },
    "API request failed",
  )

  logError(appError)

  let statusCode = 500 // Default server error
  switch (appError.type) {
    case ErrorType.API_INVALID_PARAMS:
      statusCode = 400
      break
    case ErrorType.API_UNAUTHORIZED:
      statusCode = 401
      break
    case ErrorType.API_FORBIDDEN:
      statusCode = 403
      break
    case ErrorType.API_NOT_FOUND:
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
    const appError = createError(errorType, error, metadata)
    logError(appError)
    return [null, appError]
  }
}

export function logAuditEvent(eventData: any): void {
  console.log("Audit event:", eventData)
  return
}
