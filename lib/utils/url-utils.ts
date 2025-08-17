import { AppError, createError, ErrorType, handleServerError, tryCatch } from "@/lib/utils/error-handler"

/**
 * Gets the application URL from environment variables or falls back to localhost
 * @returns The application URL
 */
export async function getAppUrl(): Promise<string> {
  const [appUrl, error]: [string | null, AppError | null] = await tryCatch(
    async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl
    },
    (error: any) => {
      return handleServerError(error, {
        service: "UrlUtils",
        operation: "getAppUrl",
        message: "Failed to get application URL",
        errorType: ErrorType.CONFIG_ERROR,
      })
    },
  )

  if (appUrl && appUrl !== null) {
    return appUrl
  } else {
    throw error
  }
}

/**
 * Joins URL parts safely without creating double slashes
 * @param base The base URL
 * @param path The path to append
 * @returns The joined URL without double slashes
 */
export async function joinUrl(base: string, path: string): Promise<string> {
  const [url, error]: [string | null, AppError | null] = await tryCatch(
    async () => {
      if (!base) {
        throw createError(ErrorType.INVALID_INPUT, null, {
          message: "Base URL is required",
        })
      }

      const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base
      const normalizedPath = path.startsWith("/") ? path : `/${path}`
      return `${normalizedBase}${normalizedPath}`
    },
    (error: any) => {
      return handleServerError(error, {
        service: "UrlUtils",
        operation: "joinUrl",
        message: "Failed to join URL parts",
        errorType: ErrorType.API_SERVER_ERROR,
      })
    },
  )

  if (url && url !== null) {
    return url
  } else {
    throw error
  }
}
