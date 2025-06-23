"use client"

import { useState, useEffect } from "react"
import { ProgramCard } from "@/components/programs/ProgramCard"
import { NewProgramDialog } from "@/components/programs/new-program-dialog"
import { ProgramEditor } from "@/components/programs/program-editor"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, getDocs, query, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { useCurrentUser } from "@/hooks/use-current-user"
import { PageSkeleton } from "@/components/shared/page-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import type { WorkoutProgram } from "@/types/workout-program"
import { AssignProgramDialog } from "@/components/programs/assign-program-dialog" // Keep this import for now, but it will be removed if not used elsewhere

export default function ProgramsPageClient() {
  const { user: trainer } = useCurrentUser()
  const { toast } = useToast()
  const [programs, setPrograms] = useState<WorkoutProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewProgramDialogOpen, setIsNewProgramDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null)
  const [showAssignProgramDialog, setShowAssignProgramDialog] = useState(false)
  const [programToAssign, setProgramToAssign] = useState<WorkoutProgram | null>(null)

  useEffect(() => {
    if (trainer?.uid) {
      fetchPrograms(trainer.uid)
    } else if (!trainer?.isAnonymous) {
      setLoading(false) // Not logged in, no programs to load
    }
  }, [trainer?.uid, trainer?.isAnonymous])

  const fetchPrograms = async (trainerId: string) => {
    setLoading(true)
    try {
      const programsRef = collection(db, `users/${trainerId}/programs`)
      const q = query(programsRef)
      const querySnapshot = await getDocs(q)
      const fetchedPrograms: WorkoutProgram[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as WorkoutProgram),
      }))
      setPrograms(fetchedPrograms)
    } catch (error) {
      console.error("Error fetching programs:", error)
      toast({
        title: "Error",
        description: "Failed to load programs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProgramAdded = (newProgram: WorkoutProgram) => {
    setPrograms((prev) => [...prev, newProgram])
    setIsNewProgramDialogOpen(false)
    toast({
      title: "Success",
      description: "Program created successfully!",
    })
  }

  const handleProgramUpdated = (updatedProgram: WorkoutProgram) => {
    setPrograms((prev) => prev.map((p) => (p.id === updatedProgram.id ? updatedProgram : p)))
    setEditingProgram(null)
    toast({
      title: "Success",
      description: "Program updated successfully!",
    })
  }

  const handleDeleteProgram = async (programId: string) => {
    if (!trainer?.uid) return

    if (window.confirm("Are you sure you want to delete this program? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, `users/${trainer.uid}/programs`, programId))
        setPrograms((prev) => prev.filter((p) => p.id !== programId))
        toast({
          title: "Success",
          description: "Program deleted successfully!",
        })
      } catch (error) {
        console.error("Error deleting program:", error)
        toast({
          title: "Error",
          description: "Failed to delete program.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAssignProgram = (program: WorkoutProgram) => {
    setProgramToAssign(program)
    setShowAssignProgramDialog(true)
  }

  if (loading) {
    return <PageSkeleton title="Programs" description="Loading your workout programs..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Programs</h1>
        <Button onClick={() => setIsNewProgramDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          title="No Programs Yet"
          description="Create your first workout program to get started."
          buttonText="Create New Program"
          onButtonClick={() => setIsNewProgramDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onEdit={setEditingProgram}
              onDelete={handleDeleteProgram}
              onAssign={handleAssignProgram}
            />
          ))}
        </div>
      )}

      <NewProgramDialog
        isOpen={isNewProgramDialogOpen}
        onClose={() => setIsNewProgramDialogOpen(false)}
        onProgramAdded={handleProgramAdded}
      />

      {editingProgram && (
        <ProgramEditor
          isOpen={!!editingProgram}
          onClose={() => setEditingProgram(null)}
          program={editingProgram}
          onProgramUpdated={handleProgramUpdated}
        />
      )}

      {programToAssign && (
        <AssignProgramDialog
          isOpen={showAssignProgramDialog}
          onClose={() => {
            setShowAssignProgramDialog(false)
            setProgramToAssign(null)
          }}
          program={programToAssign}
        />
      )}
    </div>
  )
}
