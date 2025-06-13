"use client"

import type { ReactNode } from "react"

interface ActionButtonProps {
  children: ReactNode
  onClick: () => void
  variant?: "primary" | "secondary" | "outline"
  icon?: ReactNode
  className?: string
}

export function ActionButton({ children, onClick, variant = "outline", icon, className = "" }: ActionButtonProps) {
  const baseStyles = "px-3 py-2 rounded-lg flex items-center gap-2 text-sm"

  const variantStyles = {
    primary: "bg-lime-300 text-zinc-800 font-medium",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-200 hover:bg-gray-50",
  }

  return (
    <button onClick={onClick} className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {icon}
      <span>{children}</span>
    </button>
  )
}
