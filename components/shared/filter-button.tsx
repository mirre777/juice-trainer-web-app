"use client"

import { ChevronDown } from "lucide-react"

interface FilterButtonProps {
  label: string
  onClick: () => void
  className?: string
}

export function FilterButton({ label, onClick, className = "" }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 border border-gray-200 rounded-lg flex items-center gap-2 ${className}`}
    >
      <span>{label}</span>
      <ChevronDown className="h-4 w-4" />
    </button>
  )
}
