"use client"

import { usePathname } from "next/navigation"
import { AppError, ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function usePathDetection() {
  let pathname: string | null = null
  try {
    pathname = usePathname()

    if (!pathname) {
      throw new AppError({
        message: "Path not available",
        errorType: ErrorType.NAVIGATION_ERROR,
      })
    }

    const isDemoMode = pathname.startsWith("/demo")
    const pathPrefix = isDemoMode ? "/demo" : ""

    return {
      isDemoMode,
      pathPrefix,
    }
  } catch (err) {
    const appError = handleClientError(err, {
      component: "usePathDetection",
      operation: "detectPath",
      message: "Failed to detect path",
      errorType: ErrorType.NAVIGATION_ERROR,
    })

    console.error("Path detection error:", appError)

    // Return default values to prevent UI crashes
    return {
      isDemoMode: false,
      pathPrefix: "",
    }
  }
}
