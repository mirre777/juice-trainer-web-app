"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"

interface ComingSoonOverlayProps {
  children?: React.ReactNode
  show?: boolean
}

export function ComingSoonOverlay({ children, show = true }: ComingSoonOverlayProps) {
  if (!show) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children && <div className="opacity-20 pointer-events-none">{children}</div>}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-gray-600">This feature is currently under development and will be available soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
