"use client"

import { usePathname } from "next/navigation"

export function usePathDetection() {
  const pathname = usePathname()

  let isDemoMode = false
  let pathPrefix = ""

  if (!pathname) {
    throw new Error("Path not available")
  }

  isDemoMode = pathname.startsWith("/demo")
  pathPrefix = isDemoMode ? "/demo" : ""

  return {
    isDemoMode,
    pathPrefix,
  }
}
