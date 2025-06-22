import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  actionText?: string
  actionLink?: string
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, actionText, actionLink, icon, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      {icon && <div className="rounded-full bg-gray-100 p-3 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-500 mb-4 max-w-md">{description}</p>
      {actionText && actionLink && (
        <Link href={actionLink}>
          <Button className="bg-[#CCFF00] text-black hover:bg-[#b8e600]">{actionText}</Button>
        </Link>
      )}
    </div>
  )
}
