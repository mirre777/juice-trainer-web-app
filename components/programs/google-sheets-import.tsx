"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SheetsImportDialog } from "./sheets-import-dialog"
import { Loader2 } from "lucide-react"

interface GoogleSheetsImportProps {
  onImport: (data: { name: string; url: string }) => void
  isLoading?: boolean
}

export function GoogleSheetsImport({ onImport, isLoading = false }: GoogleSheetsImportProps) {
  const [programName, setProgramName] = useState("")
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [showInstructions, setShowInstructions] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (programName.trim() && sheetsUrl.trim()) {
      onImport({
        name: programName.trim(),
        url: sheetsUrl.trim(),
      })
    }
  }

  const handleSheetsUrlFocus = () => {
    setShowInstructions(true)
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-green-600 rounded grid grid-cols-3 gap-0.5 p-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-sm" />
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Import Your Workout Program</CardTitle>
          <CardDescription>
            Paste your Google Sheets link. We'll turn it into a structured program for your client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="program-name">
                Program Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="program-name"
                type="text"
                placeholder="e.g., My Client's Strength Program"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheets-url">
                Google Sheets Link <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sheets-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                onFocus={handleSheetsUrlFocus}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                You can still review and edit it before you send it to your clients in the Juice mobile app.
              </p>
              <Button
                type="submit"
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
          </form>
        </CardContent>
      </Card>

      <SheetsImportDialog isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
    </>
  )
}
