"use client"

import { ClientInitials } from "@/components/shared/client-initials"
import { Copy, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SessionCardProps {
  time: string
  duration: number
  clientName: string
  clientInitials: string
  sessionType: string
  onClick?: () => void
}

export function SessionCard({ time, duration, clientName, clientInitials, sessionType, onClick }: SessionCardProps) {
  return (
    <div
      className="flex items-center p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-center mr-4 text-center">
        <div className="text-gray-700 font-medium">{time}</div>
        <div className="text-gray-500 text-sm">{duration} min</div>
      </div>

      <ClientInitials initials={clientInitials} className="w-12 h-12 mr-4" />

      <div className="flex-1">
        <div className="font-medium text-gray-900">{clientName}</div>
        <div className="text-gray-500">{sessionType}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
