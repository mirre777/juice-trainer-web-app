"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface RowCTAProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function RowGreenCTA({ children, onClick, className }: RowCTAProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-[#D2FF28] text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#c2ef18] transition-colors",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function RowWhiteCTA({ children, className, onClick }: RowCTAProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
        className,
      )}
    >
      {children}
    </button>
  )
}
