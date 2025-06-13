"use client"

import type React from "react"
import type { ReactNode } from "react"

interface PageLayoutProps {
  title?: string
  description?: string
  children: ReactNode
  action?: React.ReactNode
  isDemo?: boolean
}

export function PageLayout({ title, description, children, action, isDemo = false }: PageLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Remove the UnifiedHeader since it's now in ClientLayout */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-20">
        <div className="max-w-[1280px] mx-auto pt-4">
          {/* Title section with optional action */}
          {(title || action) && (
            <div className="flex items-center justify-between mb-6 pt-4">
              {title && (
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  {description && <p className="text-gray-500 text-sm mt-1">{description}</p>} {/* Added text-sm */}
                </div>
              )}
              {action && <div>{action}</div>}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
