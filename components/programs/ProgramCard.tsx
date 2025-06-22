"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock } from "lucide-react"

interface Program {
  id: string
  name: string
  description?: string
  duration: number // weeks
  clientsAssigned: number
  createdAt: Date
  status: "active" | "draft" | "archived"
}

interface ProgramCardProps {
  program: Program
  onClick?: (program: Program) => void
  onEdit?: (program: Program) => void
  onDelete?: (program: Program) => void
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onClick, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onClick?.(program)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{program.name}</CardTitle>
          <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
        </div>
        {program.description && <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{program.duration} weeks</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{program.clientsAssigned} clients assigned</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Created {program.createdAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(program)
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(program)
            }}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgramCard
