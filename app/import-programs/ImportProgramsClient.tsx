"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast as useCustomToast } from "@/components/toast-provider"
import { SheetsImportDialog } from "@/components/programs/sheets-import-dialog"
import { FileSpreadsheet, Plus, Calendar, Users, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface ImportedProgram {
  id: string
  name: string
  description: string
  duration: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  exercises: number
  status: "pending" | "imported" | "error"
  importedAt: Date
  source: "google-sheets" | "manual"
}

export default function ImportProgramsClient() {
  const [programs, setPrograms] = useState<ImportedProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useCustomToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Simulate loading programs
    const timer = setTimeout(() => {
      setPrograms([
        {
          id: "1",
          name: "Upper Body Strength",
          description: "Comprehensive upper body workout focusing on compound movements",
          duration: "8 weeks",
          difficulty: "Intermediate",
          exercises: 12,
          status: "imported",
          importedAt: new Date("2024-01-15"),
          source: "google-sheets",
        },
        {
          id: "2",
          name: "Beginner Full Body",
          description: "Perfect starting program for new clients",
          duration: "4 weeks",
          difficulty: "Beginner",
          exercises: 8,
          status: "imported",
          importedAt: new Date("2024-01-10"),
          source: "google-sheets",
        },
        {
          id: "3",
          name: "Advanced Powerlifting",
          description: "High intensity powerlifting program",
          duration: "12 weeks",
          difficulty: "Advanced",
          exercises: 15,
          status: "pending",
          importedAt: new Date("2024-01-20"),
          source: "google-sheets",
        },
      ])
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleImportSuccess = (programName: string) => {
    if (isClient) {
      toast.success({
        title: "Program imported successfully!",
        description: `${programName} has been added to your program library.`,
        duration: 5000,
      })
    }

    // Refresh programs list
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleImportError = (error: string) => {
    if (isClient) {
      toast.error({
        title: "Import failed",
        description: error,
        duration: 5000,
      })
    }
  }

  const getStatusIcon = (status: ImportedProgram["status"]) => {
    switch (status) {
      case "imported":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: ImportedProgram["status"]) => {
    switch (status) {
      case "imported":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const getDifficultyColor = (difficulty: ImportedProgram["difficulty"]) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Programs</h1>
          <p className="text-muted-foreground">Import workout programs from Google Sheets or create them manually</p>
        </div>
        <Button onClick={() => setShowImportDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Import Program
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Programs</p>
                <p className="text-2xl font-bold">{programs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Imported</p>
                <p className="text-2xl font-bold">{programs.filter((p) => p.status === "imported").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{programs.filter((p) => p.status === "pending").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Exercises</p>
                <p className="text-2xl font-bold">{programs.reduce((acc, p) => acc + p.exercises, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Instructions */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          Import programs directly from Google Sheets. Make sure your sheet follows the required format with columns for
          exercise name, sets, reps, and rest periods.
        </AlertDescription>
      </Alert>

      {/* Programs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Imported Programs</h2>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No programs imported yet</h3>
              <p className="text-muted-foreground mb-4">Start by importing your first program from Google Sheets</p>
              <Button onClick={() => setShowImportDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Import Your First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {program.name}
                          {getStatusIcon(program.status)}
                        </CardTitle>
                        <CardDescription>{program.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {program.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {program.exercises} exercises
                      </div>
                      <Badge variant="outline" className={getDifficultyColor(program.difficulty)}>
                        {program.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Imported {program.importedAt.toLocaleDateString()}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileSpreadsheet className="h-4 w-4" />
                        Source: {program.source === "google-sheets" ? "Google Sheets" : "Manual"}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm">Assign to Client</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Import Dialog */}
      <SheetsImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={handleImportSuccess}
        onImportError={handleImportError}
      />
    </div>
  )
}
