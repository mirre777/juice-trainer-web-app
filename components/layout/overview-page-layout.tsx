"use client"

import type React from "react"

interface OverviewPageLayoutProps {
  children: React.ReactNode
  isDemo?: boolean
}

export function OverviewPageLayout({ children, isDemo = false }: OverviewPageLayoutProps) {
  return (
    <div className="w-full">
      {/* Header is now handled by ClientLayout, so just render children */}
      {children}
    </div>
  )
}
