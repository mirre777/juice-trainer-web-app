import { AppError, ErrorType, handleServerError, tryCatch } from "@/lib/utils/error-handler"

/**
 * Gets the application URL from environment variables or falls back to localhost
 * @returns The application URL
 */
export function getAppUrl(): string {
  return tryCatch(
    () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl
    },
    (error) => {
      throw handleServerError(error, {
        service: "UrlUtils",
        operation: "getAppUrl",
        message: "Failed to get application URL",
        errorType: ErrorType.CONFIG_ERROR,
      })
    },
  )
}

/**
 * Joins URL parts safely without creating double slashes
 * @param base The base URL
 * @param path The path to append
 * @returns The joined URL without double slashes
 */
export function joinUrl(base: string, path: string): string {
  return tryCatch(
    () => {
      if (!base) {
        throw new AppError({
          message: "Base URL is required",
          errorType: ErrorType.VALIDATION_ERROR,
        })
      }

      const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base
      const normalizedPath = path.startsWith("/") ? path : `/${path}`
      return `${normalizedBase}${normalizedPath}`
    },
    (error) => {
      throw handleServerError(error, {
        service: "UrlUtils",
        operation: "joinUrl",
        message: "Failed to join URL parts",
        errorType: ErrorType.INTERNAL_ERROR,
      })
    },
  )
}
