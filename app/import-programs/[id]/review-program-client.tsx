"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Dumbbell } from "lucide-react"
import { db } from "@/lib/firebase/firebase"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface Exercise {
  name: string
  sets?: number
  reps?: string
  weight?: string
  rest?: string
  notes?: string
  weeks?: Array<{
    sets?: number
    reps?: string
    weight?: string
  }>
}

interface Routine {
  name: string
  exercises: Exercise[]
}

interface Week {
  week_number: number
  routines: Routine[]
}

interface Program {
  name: string
  description?: string
  duration_weeks?: number
  is_periodized?: boolean
  weeks?: Week[]
  routines?: Routine[]
}

interface ImportData {
  id: string
  program: Program
  status: string
  created_at: any
  trainer_id?: string
}

interface Client {
  id: string
  name: string
  email?: string
  status?: string
}

interface ReviewProgramClientProps {
  importData: ImportData
  initialClients?: Client[]
}

export default function ReviewProgramClient({ importData, initialClients = [] }: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>(initialClients)

  const program = importData.program
  const isPeriodized = program?.is_periodized || program?.weeks?.length > 0

  useEffect(() => {
    // If no initial clients provided, fetch them client-side
    if (initialClients.length === 0) {
      fetchClients()
    }
  }, [initialClients.length])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const clientData = await response.json()
        setClients(clientData.clients || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const docRef = doc(db, "sheets_imports", importData.id)
      await updateDoc(docRef, {
        status: "approved",
        approved_at: new Date(),
      })

      toast({
        title: "Program Approved",
        description: "The program has been approved and is ready to use.",
      })

      router.push("/import-programs")
    } catch (error) {
      console.error("Error approving program:", error)
      toast({
        title: "Error",
        description: "Failed to approve program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const docRef = doc(db, "sheets_imports", importData.id)
      await deleteDoc(docRef)

      toast({
        title: "Program Rejected",
        description: "The program has been rejected and removed.",
      })

      router.push("/import-programs")
    } catch (error) {
      console.error("Error rejecting program:", error)
      toast({
        title: "Error",
        description: "Failed to reject program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderExercise = (exercise: Exercise, exerciseIndex: number) => (
    <div key={exerciseIndex} className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-2">{exercise.name}</h4>

      {isPeriodized && exercise.weeks ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Periodized progression:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {exercise.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="bg-white p-2 rounded border">
                <p className="text-xs font-medium text-gray-500">Week {weekIndex + 1}</p>
                <p className="text-sm">
                  {week.sets && `${week.sets} sets`}
                  {week.reps && ` × ${week.reps}`}
                  {week.weight && ` @ ${week.weight}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-1">
          {exercise.sets && <p>Sets: {exercise.sets}</p>}
          {exercise.reps && <p>Reps: {exercise.reps}</p>}
          {exercise.weight && <p>Weight: {exercise.weight}</p>}
          {exercise.rest && <p>Rest: {exercise.rest}</p>}
          {exercise.notes && <p>Notes: {exercise.notes}</p>}
        </div>
      )}
    </div>
  )

  const renderRoutine = (routine: Routine, routineIndex: number) => (
    <Card key={routineIndex} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          {routine.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routine.exercises?.map((exercise, exerciseIndex) => renderExercise(exercise, exerciseIndex))}
        </div>
      </CardContent>
    </Card>
  )

  if (!program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Program Not Found</h1>
          <p className="text-gray-600 mb-6">The requested program could not be loaded.</p>
          <Button onClick={() => router.push("/import-programs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Import Programs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/import-programs")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Import Programs
        </Button>

        <div className="flex gap-2">
          <Badge variant={isPeriodized ? "default" : "secondary"}>{isPeriodized ? "Periodized" : "Standard"}</Badge>
          <Badge variant="outline">
            {program.duration_weeks ? `${program.duration_weeks} weeks` : "Duration not specified"}
          </Badge>
        </div>
      </div>

      {/* Program Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {program.name || "Untitled Program"}
          </CardTitle>
          {program.description && <p className="text-gray-600">{program.description}</p>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {isPeriodized ? program.weeks?.length || 0 : program.routines?.length || 0}
              </p>
              <p className="text-sm text-gray-600">{isPeriodized ? "Weeks" : "Routines"}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{program.duration_weeks || "N/A"}</p>
              <p className="text-sm text-gray-600">Duration (weeks)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{clients.length}</p>
              <p className="text-sm text-gray-600">Available Clients</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Content */}
      <div className="space-y-6">
        {isPeriodized
          ? // Periodized Program View
            program.weeks?.map((week, weekIndex) => (
              <Card key={weekIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Week {week.week_number || weekIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {week.routines?.map((routine, routineIndex) => renderRoutine(routine, routineIndex))}
                  </div>
                </CardContent>
              </Card>
            ))
          : // Standard Program View
            program.routines?.map((routine, routineIndex) => renderRoutine(routine, routineIndex))}
      </div>

      <Separator className="my-8" />

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleReject} disabled={isLoading} className="min-w-[120px] bg-transparent">
          Reject Program
        </Button>
        <Button onClick={handleApprove} disabled={isLoading} className="min-w-[120px]">
          {isLoading ? "Processing..." : "Approve Program"}
        </Button>
      </div>
    </div>
  )
}
