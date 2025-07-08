"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileUp, Loader2, LinkIcon, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SheetsImportDialog } from "./sheets-import-dialog"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

const SESSION_STORAGE_KEY = "hasSeenImportInstructions"

export function GoogleSheetsImport() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSheetLinkDialog, setShowSheetLinkDialog] = useState(false)
  const [sheetLink, setSheetLink] = useState("")
  const [savedSheetLinks, setSavedSheetLinks] = useState<string[]>([])
  const { toast } = useToast()
  const [hasSeenInstructions, setHasSeenInstructions] = useState(false)

  useEffect(() => {
    console.log("Google Sheets Import Component Mounted")

    const seenInstructions = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true"
    setHasSeenInstructions(seenInstructions)
    console.log("Initial hasSeenInstructions from sessionStorage:", seenInstructions)

    if (process.env.NODE_ENV === "development") {
      console.log("Development mode detected - enabling import button")
      setIsAuthenticated(true)
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get("connected")
    const code = urlParams.get("code")
    const scope = urlParams.get("scope")

    console.log("URL Params:", { connected, code, scope })

    if (connected === "true" || code || scope) {
      console.log("OAuth parameters found in URL - considering authenticated")
      setIsAuthenticated(true)

      toast({
        title: "Authentication Successful",
        description: "You've successfully connected to Google Sheets",
      })

      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      console.log("Checking authentication status from API")
      fetch("/api/auth/google/status")
        .then((response) => response.json())
        .then((data) => {
          console.log("Auth status response:", data)
          const isAuth =
            data.isConnected ||
            data.hasAccessToken ||
            data.hasRefreshToken ||
            data.hasSheetsAccessToken ||
            data.hasSheetsRefreshToken

          console.log("Authentication determined:", isAuth)
          setIsAuthenticated(isAuth)
        })
        .catch((err) => {
          console.error("Error checking auth status:", err)
          setIsAuthenticated(true)
        })
    }

    const savedLinks = localStorage.getItem("googleSheetLinks")
    if (savedLinks) {
      setSavedSheetLinks(JSON.parse(savedLinks))
    }
  }, [toast])

  const handleConnectGoogleSheets = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/auth/google/sheets-auth")

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No authentication URL returned")
      }
    } catch (error) {
      console.error("Failed to initiate Google authentication:", error)
      toast({
        title: "Authentication Error",
        description: "Failed to connect to Google Sheets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportButtonClick = () => {
    if (!hasSeenInstructions) {
      setShowImportDialog(true)
    } else {
      setShowSheetLinkDialog(true)
    }
  }

  const handleSheetsImportDialogClose = (open: boolean) => {
    setShowImportDialog(open)
    if (!open) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true")
      setHasSeenInstructions(true)
      console.log("Instructions acknowledged and session storage updated.")
      setShowSheetLinkDialog(true)
    }
  }

  const handleSaveSheetLink = () => {
    if (!sheetLink) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheet link",
        variant: "destructive",
      })
      return
    }

    if (!sheetLink.includes("docs.google.com/spreadsheets")) {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid Google Sheets URL",
        variant: "destructive",
      })
      return
    }

    const updatedLinks = [...savedSheetLinks, sheetLink]
    setSavedSheetLinks(updatedLinks)
    localStorage.setItem("googleSheetLinks", JSON.stringify(updatedLinks))

    toast({
      title: "Sheet Link Saved",
      description: "Your Google Sheet link has been saved successfully",
    })

    setShowSheetLinkDialog(false)
    setSheetLink("")
  }

  const handleRemoveSheetLink = (linkToRemove: string) => {
    const updatedLinks = savedSheetLinks.filter((link) => link !== linkToRemove)
    setSavedSheetLinks(updatedLinks)
    localStorage.setItem("googleSheetLinks", JSON.stringify(updatedLinks))

    toast({
      title: "Sheet Link Removed",
      description: "The Google Sheet link has been removed",
    })
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <h2 className="text-xl font-semibold">Import from Google Sheets</h2>
      <p className="text-gray-600 max-w-md text-center">
        Connect your Google account to import workout programs from Google Sheets.
      </p>

      {isAuthenticated ? (
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-check-circle"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Connected to Google Sheets</span>
          </div>

          <div className="flex flex-col w-full space-y-4">
            <div className="flex justify-between items-center w-full">
              <Button onClick={handleImportButtonClick} variant="outline">
                <LinkIcon className="mr-2 h-4 w-4" />
                Import Google Sheet
              </Button>

              <Button onClick={() => setShowSheetLinkDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Sheet Link
              </Button>
            </div>

            {savedSheetLinks.length > 0 && (
              <div className="mt-4 w-full">
                <h3 className="text-sm font-medium mb-2">Saved Sheet Links:</h3>
                <div className="space-y-2">
                  {savedSheetLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate max-w-[250px]"
                      >
                        {link.split("/").pop() || link}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSheetLink(link)}
                        className="h-8 w-8 p-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-x"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Button onClick={handleConnectGoogleSheets} disabled={isLoading} className="mt-4">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Connect Google Sheets
            </>
          )}
        </Button>
      )}

      <SheetsImportDialog open={showImportDialog} onOpenChange={handleSheetsImportDialogClose} />

      <Dialog open={showSheetLinkDialog} onOpenChange={setShowSheetLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Google Sheet Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <p className="text-sm text-gray-500">Enter the URL of your Google Sheet to save it for quick access.</p>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetLink}
              onChange={(e) => setSheetLink(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSheetLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSheetLink}>Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
