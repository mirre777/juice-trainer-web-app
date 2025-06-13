"use client"

import type { ReactNode } from "react"

interface SearchFilterBarProps {
  children: ReactNode
  className?: string
}

export function SearchFilterBar({ children, className = "" }: SearchFilterBarProps) {
  return (
    <div className={`relative h-24 mb-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-16">
        <div className="flex justify-between items-center p-4">{children}</div>
      </div>
    </div>
  )
}
