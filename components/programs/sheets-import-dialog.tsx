"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

interface SheetsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SheetsImportDialog({ open, onOpenChange }: SheetsImportDialogProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [savedLinks, setSavedLinks] = useState<string[]>([])
  const [selectedSavedLink, setSelectedSavedLink] = useState("")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isPreloading, setIsPreloading] = useState(true)
  const { toast } = useToast()

  // Preload the image when dialog opens
  useEffect(() => {
    if (open) {
      setIsPreloading(true)
      setImageLoaded(false)

      const img = new window.Image()
      img.onload = () => {
        setImageLoaded(true)
        setIsPreloading(false)
      }
      img.onerror = () => {
        setIsPreloading(false)
      }
      img.src = "/google-sheets-share-dialog.png"

      // Load saved sheet links from localStorage
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

  const handleOkThanks = () => {
    // Store in sessionStorage - will show again in new session
    sessionStorage.setItem("hasSeenSheetsInstructions", "true")
    onOpenChange(false)
  }

  const handleDontShowAgain = () => {
    // Store in localStorage - permanent for this user
    localStorage.setItem("dontShowSheetsInstructions", "true")
    onOpenChange(false)
  }

  const handleClose = () => {
    // Same as "Ok Thanks" - store in sessionStorage
    sessionStorage.setItem("hasSeenSheetsInstructions", "true")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm">📊</span>
              </div>
              <DialogTitle className="text-lg font-semibold">How to get your Google Sheets link:</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <p className="text-sm text-gray-700">Open your workout program in Google Sheets.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <p className="text-sm text-gray-700">Click "Share" → "Anyone with the link can view".</p>
            </div>
          </div>

          {/* Image container with loading state */}
          <div className="relative bg-gray-50 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
            {isPreloading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading image...</span>
              </div>
            )}

            {imageLoaded && (
              <div className="w-full max-w-md">
                <Image
                  src="/google-sheets-share-dialog.png"
                  alt="Google Sheets sharing dialog"
                  width={400}
                  height={300}
                  className="w-full h-auto rounded border"
                  priority
                />
              </div>
            )}

            {!isPreloading && !imageLoaded && <div className="text-gray-500 text-sm">Image could not be loaded</div>}
          </div>

          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              3
            </span>
            <p className="text-sm text-gray-700">Paste the link into the field above.</p>
          </div>

          {savedLinks.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="saved-links" className="text-sm font-medium">
                Or select a saved sheet:
              </Label>
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

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="sheet-url" className="text-sm font-medium">
              Google Sheet URL
            </Label>
            <Input
              id="sheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">Enter the URL of the Google Sheet containing your workout program.</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleDontShowAgain}
              disabled={isImporting}
              className="flex-1 sm:flex-none bg-transparent"
            >
              Don't show me again
            </Button>
            <Button onClick={handleOkThanks} disabled={isImporting} className="flex-1 sm:flex-none">
              Ok Thanks
            </Button>
          </div>

          {sheetUrl && (
            <Button onClick={handleImport} disabled={isImporting} className="w-full sm:w-auto">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Sheet"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
