import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Send } from 'lucide-react'
import type { WorkoutProgram } from "@/types/workout-program"

interface ProgramCardProps {
  program: WorkoutProgram
  onEdit: (program: WorkoutProgram) => void
  onDelete: (programId: string) => void
  onAssign: (program: WorkoutProgram) => void // Keep this prop for now, but it will be triggered differently
}

export function ProgramCard({ program, onEdit, onDelete, onAssign }: ProgramCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{program.program_title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(program)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(program.id!)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssign(program)}>
              <Send className="w-4 h-4 mr-2" />
              Assign to Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-gray-500">
          {program.program_notes || "No notes available."}
        </CardDescription>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Weeks:</strong> {program.program_weeks}
          </p>
          <p>
            <strong>Periodized:</strong> {program.is_periodized ? "Yes" : "No"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
