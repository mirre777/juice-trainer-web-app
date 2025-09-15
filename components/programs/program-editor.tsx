"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useProgramContext } from "@/contexts/program-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Plus } from "lucide-react"
import RoutineEditor from "./routine-editor"
import NewProgramDialog from "./new-program-dialog"
import ProgramPreview from "./program-preview"

interface ProgramEditorProps {
  hideNewProgramDialog?: boolean
}

export default function ProgramEditor({ hideNewProgramDialog = false }: ProgramEditorProps) {
  const { program, setProgram, saveProgram, loading } = useProgramContext()

  const [activeTab, setActiveTab] = useState<string>("overview")
  const [showNewProgramDialog, setShowNewProgramDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // If no program exists, show dialog to create one
  useEffect(() => {
    if (!program && !hideNewProgramDialog) {
      setShowNewProgramDialog(true)
    }
  }, [program, hideNewProgramDialog])

  if (showPreview && program) {
    return <ProgramPreview program={program} onClose={() => setShowPreview(false)} />
  }

  if (!program) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowNewProgramDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Program
            </Button>
          </div>
        </div>
        {!hideNewProgramDialog && (
          <NewProgramDialog open={showNewProgramDialog} onOpenChange={setShowNewProgramDialog} />
        )}
      </>
    )
  }

  const handleProgramTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgram((prev) => {
      if (!prev) return prev
      return { ...prev, program_title: e.target.value }
    })
  }

  const handleProgramNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProgram((prev) => {
      if (!prev) return prev
      return { ...prev, program_notes: e.target.value }
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {program.routines.map((routine, index) => (
            <TabsTrigger key={index} value={`routine-${index}`}>
              {routine.routine_name}
            </TabsTrigger>
          ))}
          {program.routines.length < 10 && (
            <TabsTrigger value="add-routine" className="bg-lime-100 hover:bg-lime-200">
              <Plus className="h-4 w-4 mr-1" /> Add Routine
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Program Title</label>
                <Input
                  value={program.name}
                  onChange={handleProgramTitleChange}
                  placeholder="Enter program title"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Program Duration (weeks)</label>
                  <Input
                    type="number"
                    value={program.program_weeks}
                    onChange={(e) =>
                      setProgram((prev) => {
                        if (!prev) return prev
                        return { ...prev, program_weeks: Number.parseInt(e.target.value) || 1 }
                      })
                    }
                    min={1}
                    max={52}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Number of Routines</label>
                  <Input value={program.routine_count} readOnly disabled />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Program Notes</label>
                <Textarea
                  value={program.program_notes || ""}
                  onChange={handleProgramNotesChange}
                  placeholder="Enter any notes about this program..."
                  rows={5}
                />
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-medium mb-3">Routines</h3>
                <div className="space-y-3">
                  {program.routines.map((routine, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <h4 className="font-medium">{routine.routine_name}</h4>
                        <p className="text-sm text-muted-foreground">{routine.exercises.length} exercises</p>
                      </div>
                      <Button variant="ghost" onClick={() => setActiveTab(`routine-${index}`)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {program.routines.map((routine, index) => (
          <TabsContent key={index} value={`routine-${index}`} className="mt-6">
            <RoutineEditor routineIndex={index} programWeeks={program.program_weeks} />
          </TabsContent>
        ))}

        <TabsContent value="add-routine" className="mt-6">
          <NewRoutineForm onClose={() => setActiveTab("overview")} />
        </TabsContent>
      </Tabs>

      {!hideNewProgramDialog && <NewProgramDialog open={showNewProgramDialog} onOpenChange={setShowNewProgramDialog} />}
    </div>
  )
}

function NewRoutineForm({ onClose }: { onClose: () => void }) {
  const [routineName, setRoutineName] = useState("")
  const { addRoutine } = useProgramContext()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (routineName.trim()) {
      addRoutine(routineName)
      onClose()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Routine</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Routine Name</label>
            <Input
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., Upper Body, Lower Body, Push, Pull, etc."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!routineName.trim()}>
              Add Routine
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
