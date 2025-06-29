"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SheetsImportDialog } from "./sheets-import-dialog"
import { Loader2 } from "lucide-react"

export function GoogleSheetsImport() {
  const [programName, setProgramName] = useState("")
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleSheetsInputFocus = () => {
    setShowDialog(true)
  }

  const handleImport = async () => {
    if (!programName.trim() || !sheetsUrl.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/programs/import-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programName: programName.trim(),
          sheetsUrl: sheetsUrl.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Handle successful import
        console.log("Import successful:", result)
        // Reset form
        setProgramName("")
        setSheetsUrl("")
      } else {
        console.error("Import failed:", response.statusText)
      }
    } catch (error) {
      console.error("Import error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-green-600 rounded grid grid-cols-3 gap-0.5 p-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-sm"></div>
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Your Workout Program</h1>
        <p className="text-gray-600">
          Paste your Google Sheets link. We'll turn it into a structured program for your client.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>Enter your program information and Google Sheets link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="program-name">
              Program Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="program-name"
              placeholder="e.g., My Client's Strength Program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheets-url">
              Google Sheets Link <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sheets-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              onFocus={handleSheetsInputFocus}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-gray-600">
              You can still review and edit it before you send it to your clients in the Juice mobile app.
            </p>
            <Button
              onClick={handleImport}
              disabled={!programName.trim() || !sheetsUrl.trim() || isLoading}
              className="bg-lime-400 hover:bg-lime-500 text-black font-medium px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SheetsImportDialog isOpen={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  )
}
