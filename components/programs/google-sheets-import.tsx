"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { SheetsImportDialog } from "./sheets-import-dialog"

interface GoogleSheetsImportProps {
  onImportSuccess?: (data: any) => void
  onImportError?: (error: string) => void
}

export function GoogleSheetsImport({ onImportSuccess, onImportError }: GoogleSheetsImportProps) {
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importMessage, setImportMessage] = useState("")
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false)

  const handleUrlFocus = () => {
    // Check if we should show the instructions dialog
    const dontShowAgain = localStorage.getItem("dontShowSheetsInstructions")
    const hasSeenThisSession = sessionStorage.getItem("hasSeenSheetsInstructions")

    if (dontShowAgain !== "true" && hasSeenThisSession !== "true") {
      setShowInstructionsDialog(true)
    }
  }

  const handleImport = async () => {
    if (!sheetsUrl.trim()) {
      setImportStatus("error")
      setImportMessage("Please enter a Google Sheets URL")
      onImportError?.("Please enter a Google Sheets URL")
      return
    }

    // Validate Google Sheets URL
    if (!sheetsUrl.includes("docs.google.com/spreadsheets")) {
      setImportStatus("error")
      setImportMessage("Please enter a valid Google Sheets URL")
      onImportError?.("Please enter a valid Google Sheets URL")
      return
    }

    setIsImporting(true)
    setImportStatus("idle")
    setImportMessage("")

    try {
      const response = await fetch("/api/programs/import-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetsUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import from Google Sheets")
      }

      setImportStatus("success")
      setImportMessage("Successfully imported program from Google Sheets!")
      onImportSuccess?.(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import from Google Sheets"
      setImportStatus("error")
      setImportMessage(errorMessage)
      onImportError?.(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isImporting) {
      handleImport()
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import from Google Sheets
          </CardTitle>
          <CardDescription>Import your workout program directly from a Google Sheets document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheets-url">Google Sheets URL</Label>
            <Input
              id="sheets-url"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              onFocus={handleUrlFocus}
              onKeyPress={handleKeyPress}
              disabled={isImporting}
            />
          </div>

          {importStatus !== "idle" && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                importStatus === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {importStatus === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">{importMessage}</span>
            </div>
          )}

          <Button onClick={handleImport} disabled={isImporting || !sheetsUrl.trim()} className="w-full">
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Program"
            )}
          </Button>
        </CardContent>
      </Card>

      <SheetsImportDialog isOpen={showInstructionsDialog} onClose={() => setShowInstructionsDialog(false)} />
    </>
  )
}
