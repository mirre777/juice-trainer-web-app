"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check if we're in demo mode by looking at the URL
    const isDemo = window.location.pathname.startsWith("/demo")
    setIsDemoMode(isDemo)

    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem("demo-banner-dismissed")
    setIsVisible(isDemo && !dismissed)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("demo-banner-dismissed", "true")
  }

  if (!isVisible || !isDemoMode) {
    return null
  }

  return (
    <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 relative">
      <div className="flex items-center justify-center text-sm text-yellow-800">
        <span className="font-medium">Demo Mode:</span>
        <span className="ml-1">You are viewing a demonstration of the platform with sample data.</span>
        <button
          onClick={handleDismiss}
          className="ml-4 text-yellow-600 hover:text-yellow-800 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
