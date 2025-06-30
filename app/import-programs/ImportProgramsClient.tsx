"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, Upload, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"

interface ImportedProgram {
  id: string
  name: string
  status: "processing" | "completed" | "error"
  createdAt: string
  exerciseCount?: number
  weekCount?: number
  error?: string
}

export default function ImportProgramsClient() {
  const [programs, setPrograms] = useState<ImportedProgram[]>([])
  const [loading, setLoading] = useState(false)
  const [sheetUrl, setSheetUrl] = useState("")
  const [programName, setProgramName] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()
  const { user } = useCurrentUser()

  useEffect(() => {
    loadImportedPrograms()
  }, [])

  const loadImportedPrograms = async () => {
    // Mock data for now - replace with actual API call
    const mockPrograms: ImportedProgram[] = [
      {
        id: "1",
        name: "Upper/Lower Split",
        status: "completed",
        createdAt: new Date().toISOString(),
        exerciseCount: 24,
        weekCount: 4,
      },
      {
        id: "2",
        name: "Push/Pull/Legs",
        status: "processing",
        createdAt: new Date().toISOString(),
      },
    ]
    setPrograms(mockPrograms)
  }

  const handleImport = async () => {
    if (!sheetUrl || !programName) {
      toast({
        title: "Missing Information",
        description: "Please provide both a sheet URL and program name.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newProgram: ImportedProgram = {
        id: Date.now().toString(),
        name: programName,
        status: "processing",
        createdAt: new Date().toISOString(),
      }

      setPrograms((prev) => [newProgram, ...prev])

      // Show success toast
      toast({
        title: "Import Started",
        description: `Started importing "${programName}". You'll be notified when it's ready.`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Clear form
      setSheetUrl("")
      setProgramName("")
      setDescription("")

      // Simulate completion after 5 seconds
      setTimeout(() => {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === newProgram.id ? { ...p, status: "completed" as const, exerciseCount: 18, weekCount: 6 } : p,
          ),
        )

        // Show completion toast
        toast({
          title: "Program Ready! 🎉",
          description: `"${programName}" has been successfully imported and is ready to use.`,
          className: "bg-green-50 border-green-200 text-green-800",
        })
      }, 5000)
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing your program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Import Programs</h1>
        </div>

        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import from Google Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheetUrl">Google Sheets URL</Label>
              <Input
                id="sheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="programName">Program Name</Label>
              <Input
                id="programName"
                placeholder="e.g., Upper/Lower Split"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the program..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleImport} disabled={loading || !sheetUrl || !programName} className="w-full">
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Program
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Imported Programs */}
        <Card>
          <CardHeader>
            <CardTitle>Imported Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No programs imported yet</h3>
                <p className="text-gray-500">Import your first program from Google Sheets to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {programs.map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{program.name}</h3>
                        <p className="text-sm text-gray-500">
                          Imported {new Date(program.createdAt).toLocaleDateString()}
                        </p>
                        {program.exerciseCount && program.weekCount && (
                          <p className="text-xs text-gray-400">
                            {program.exerciseCount} exercises • {program.weekCount} weeks
                          </p>
                        )}
                        {program.error && <p className="text-xs text-red-600">{program.error}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(program.status)}
                        <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
