"use client"

import { usePathname } from "next/navigation"
import { AppError, ErrorType } from "@/lib/utils/error-handler"

export function usePathDetection() {
  const pathname = usePathname()

  let isDemoMode = false
  let pathPrefix = ""

  if (!pathname) {
    throw new AppError({
      message: "Path not available",
      errorType: ErrorType.NAVIGATION_ERROR,
    })
  }

  isDemoMode = pathname.startsWith("/demo")
  pathPrefix = isDemoMode ? "/demo" : ""

  return {
    isDemoMode,
    pathPrefix,
  }
}
