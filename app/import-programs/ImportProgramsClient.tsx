"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { GoogleSheetsAuthButton } from "@/components/google-sheets/auth-button"
import { useToast } from "@/hooks/use-toast"

interface ImportStatus {
  id: string
  status: "pending" | "processing" | "completed" | "error"
  programName: string
  createdAt: string
  error?: string
}

export default function ImportProgramsClient() {
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [programName, setProgramName] = useState("")
  const [description, setDescription] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [imports, setImports] = useState<ImportStatus[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Poll for import status updates
    const interval = setInterval(() => {
      checkImportStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const checkImportStatus = async () => {
    try {
      const response = await fetch("/api/sheets-imports")
      if (response.ok) {
        const data = await response.json()
        setImports(data.imports || [])

        // Check for newly completed imports
        data.imports?.forEach((importItem: ImportStatus) => {
          if (importItem.status === "completed") {
            // Show success toast for completed imports
            toast({
              title: "Program Ready!",
              description: `${importItem.programName} has been successfully imported and is ready to use.`,
              variant: "default",
              className: "bg-green-50 border-green-200 text-green-800",
            })
          }
        })
      }
    } catch (error) {
      console.error("Error checking import status:", error)
    }
  }

  const handleImport = async () => {
    if (!sheetsUrl || !programName) {
      toast({
        title: "Missing Information",
        description: "Please provide both a Google Sheets URL and program name.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch("/api/programs/import-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetsUrl,
          programName,
          description,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Import Started",
          description: "Your program is being imported. You'll be notified when it's ready.",
          variant: "default",
        })

        // Reset form
        setSheetsUrl("")
        setProgramName("")
        setDescription("")

        // Refresh imports list
        checkImportStatus()
      } else {
        const error = await response.json()
        toast({
          title: "Import Failed",
          description: error.message || "Failed to start import process.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Loader2 className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
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
            <CardTitle>Import from Google Sheets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheets-url">Google Sheets URL</Label>
              <Input
                id="sheets-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-name">Program Name</Label>
              <Input
                id="program-name"
                placeholder="Enter program name"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter program description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <GoogleSheetsAuthButton />
              <Button onClick={handleImport} disabled={isImporting || !sheetsUrl || !programName} className="flex-1">
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Program
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import History */}
        {imports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {imports.map((importItem) => (
                  <div key={importItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(importItem.status)}
                      <div>
                        <h4 className="font-medium">{importItem.programName}</h4>
                        <p className="text-sm text-gray-500">{new Date(importItem.createdAt).toLocaleDateString()}</p>
                        {importItem.error && <p className="text-sm text-red-600">{importItem.error}</p>}
                      </div>
                    </div>
                    {getStatusBadge(importItem.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
