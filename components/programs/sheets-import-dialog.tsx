"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SheetsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SheetsImportDialog({ open, onOpenChange }: SheetsImportDialogProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [savedLinks, setSavedLinks] = useState<string[]>([])
  const [selectedSavedLink, setSelectedSavedLink] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Load saved sheet links from localStorage when dialog opens
    if (open) {
      const savedSheetLinks = localStorage.getItem("googleSheetLinks")
      if (savedSheetLinks) {
        setSavedLinks(JSON.parse(savedSheetLinks))
      }
    }
  }, [open])

  const handleImport = async () => {
    // Validate the URL
    if (!sheetUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a Google Sheet URL",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      // In a real implementation, you would call your API to import the sheet
      // For now, we'll simulate a successful import
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Import Successful",
        description: "Your workout program has been imported successfully",
      })

      // Close the dialog
      onOpenChange(false)
      setSheetUrl("")
    } catch (error) {
      console.error("Error importing sheet:", error)
      toast({
        title: "Import Failed",
        description: "There was an error importing your workout program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleSelectSavedLink = (value: string) => {
    setSelectedSavedLink(value)
    setSheetUrl(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Google Sheet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          {savedLinks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="saved-links">Select a saved sheet</Label>
              <Select value={selectedSavedLink} onValueChange={handleSelectSavedLink}>
                <SelectTrigger id="saved-links">
                  <SelectValue placeholder="Select a saved sheet" />
                </SelectTrigger>
                <SelectContent>
                  {savedLinks.map((link, index) => (
                    <SelectItem key={index} value={link}>
                      {link.split("/").pop() || link}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sheet-url">Google Sheet URL</Label>
            <Input
              id="sheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <p className="text-sm text-gray-500">Enter the URL of the Google Sheet containing your workout program.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
