"use client"

import type { ReactNode } from "react"

interface RowGreenCTAProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function RowGreenCTA({ children, onClick, className = "" }: RowGreenCTAProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
