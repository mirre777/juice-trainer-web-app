"use client"

import type React from "react"
import { UnifiedHeader } from "@/components/unified-header"

interface UnifiedPageLayoutProps {
  title?: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  isDemo?: boolean
}

export function UnifiedPageLayout({ title, description, children, action, isDemo = false }: UnifiedPageLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-white">
      <UnifiedHeader />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto pt-4">
          {/* Only render title section if title exists */}
          {title && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && <p className="text-gray-500 mt-1">{description}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          )}

          {/* If no title but action exists */}
          {!title && action && (
            <div className="flex items-center justify-end mb-4">
              <div>{action}</div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
