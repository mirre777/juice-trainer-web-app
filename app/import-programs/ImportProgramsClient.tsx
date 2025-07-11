"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"
import { useRouter } from "next/navigation"
import { UnifiedHeader } from "@/components/unified-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Grid3X3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { useEffect, useState, useMemo } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog" // Added DialogHeader, DialogTitle, DialogFooter
import { X } from "lucide-react"

interface SheetsImport {
  id: string
  createdAt: any
  sheetsUrl: string
  spreadsheetId: string
  status: string
  updatedAt: any
  userId: string
  programName?: string
  name?: string
  description?: string
}

interface ImportedProgram {
  id: string
  name: string
  status: string
  createdAt: string
}

// Utility function to format date and get day name
const formatImportDate = (timestamp: any) => {
  if (!timestamp) return { date: "", dayName: "" }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return { date: formattedDate, dayName }
}

// Inline editable name component
function EditableProgramName({
  importItem,
  onNameUpdate,
}: {
  importItem: SheetsImport
  onNameUpdate: (id: string, newName: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const displayName = importItem.programName || importItem.name || "Untitled"

  const handleDoubleClick = () => {
    console.log("[EditableName] Double click on:", importItem.id)
    setIsEditing(true)
    setEditValue(displayName === "Untitled" ? "" : displayName)
  }

  const handleSave = async () => {
    if (isSaving) return

    const trimmedValue = editValue.trim()
    console.log("[EditableName] Saving name:", { id: importItem.id, oldName: displayName, newName: trimmedValue })

    // If no change, just exit edit mode
    if (trimmedValue === displayName || (trimmedValue === "" && displayName === "Untitled")) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/sheets-imports/${importItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedValue || "Untitled",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update name")
      }

      const result = await response.json()
      console.log("[EditableName] Save successful:", result)

      // Update the local state
      onNameUpdate(importItem.id, result.data.name)
      setIsEditing(false)
    } catch (error) {
      console.error("[EditableName] Save failed:", error)
      alert("Failed to update program name. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(displayName === "Untitled" ? "" : displayName)
    }
  }

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-[14px] font-medium text-black font-sen h-6 px-1 py-0 border-0 bg-white focus:ring-1 focus:ring-blue-500 rounded"
        placeholder="Enter program name..."
        autoFocus
        disabled={isSaving}
      />
    )
  }

  return (
    <h3
      className="text-[14px] font-medium text-black font-sen cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors text-left"
      onClick={handleDoubleClick} // Change from onDoubleClick to onClick
      title="Click to edit" // Update the title for accessibility
    >
      {displayName}
    </h3>
  )
}

export default function ImportProgramsClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [programNameInput, setProgramNameInput] = useState("")
  const [googleSheetsLink, setGoogleSheetsLink] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [imports, setImports] = useState<SheetsImport[]>([])
  const [isLoadingImports, setIsLoadingImports] = useState(false)
  const [completedImports, setCompletedImports] = useState<SheetsImport[]>([])
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dismissedImportNotifications")
        return new Set(saved ? JSON.parse(saved) : [])
      } catch (error) {
        console.error("Failed to parse dismissed notifications from localStorage", error)
        return new Set()
      }
    }
    return new Set()
  })
  const [activeToastId, setActiveToastId] = useState<string | null>(null)
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false) // Moved here
  const [doNotShowInstructionsAgain, setDoNotShowInstructionsAgain] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("doNotShowInstructionsAgain") === "true"
    }
    return false
  })

  const [importedPrograms, setImportedPrograms] = useState<ImportedProgram[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[ImportPrograms] Checking authentication...")
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const userData = await response.json()
          const currentUserId = userData.uid
          console.log("[ImportPrograms] User authenticated:", currentUserId)
          setUserId(currentUserId)
        } else {
          console.log("[ImportPrograms] User not authenticated")
        }
      } catch (error) {
        console.error("[ImportPrograms] Error checking auth:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  // Fetch user's imports from Firebase
  useEffect(() => {
    if (!userId) {
      console.log("[ImportPrograms] No userId, clearing imports")
      setImports([])
      setCompletedImports([])
      return
    }

    console.log("[ImportPrograms] Setting up Firebase listener for userId:", userId)
    setIsLoadingImports(true)

    const q = query(
      collection(db, "sheets_imports"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50),
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log(`[ImportPrograms] Firebase snapshot received: ${querySnapshot.size} documents for user ${userId}`)

        const importsData: SheetsImport[] = []
        const newlyCompleted: SheetsImport[] = []

        querySnapshot.forEach((doc) => {
          const importData = {
            id: doc.id,
            ...doc.data(),
          } as SheetsImport

          console.log(`[ImportPrograms] Processing import:`, {
            id: importData.id,
            status: importData.status,
            userId: importData.userId,
            spreadsheetId: importData.spreadsheetId,
            programName: importData.programName,
            name: importData.name,
            rawData: doc.data(),
          })

          importsData.push(importData)

          if (importData.status === "conversion_complete" && !dismissedNotifications.has(importData.id)) {
            console.log(`[ImportPrograms] Found newly completed import (not dismissed):`, {
              id: importData.id,
              programName: importData.programName,
              name: importData.name,
              isDismissed: dismissedNotifications.has(importData.id),
            })
            newlyCompleted.push(importData)
          } else if (importData.status === "conversion_complete") {
            console.log(`[ImportPrograms] Completed import is dismissed:`, {
              id: importData.id,
              isDismissed: dismissedNotifications.has(importData.id),
            })
          }
        })

        console.log(`[ImportPrograms] Total imports for user ${userId}:`, importsData.length)
        console.log(`[ImportPrograms] Newly completed imports:`, newlyCompleted.length)

        const statusCounts = importsData.reduce(
          (acc, imp) => {
            acc[imp.status] = (acc[imp.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        console.log(`[ImportPrograms] Status breakdown:`, statusCounts)

        setImports(importsData)
        setCompletedImports(newlyCompleted)
        setIsLoadingImports(false)

        // Show toast if there are newly completed imports
        if (newlyCompleted.length > 0 && !activeToastId) {
          showCompletionToast(newlyCompleted)
        }
      },
      (error) => {
        console.error("[ImportPrograms] Firebase listener error:", error)
        setIsLoadingImports(false)
      },
    )

    return () => {
      console.log("[ImportPrograms] Cleaning up Firebase listener for userId:", userId)
      unsubscribe()
    }
  }, [userId, dismissedNotifications, activeToastId])

  // Persist dismissed notifications to localStorage
  useEffect(() => {
    localStorage.setItem("dismissedImportNotifications", JSON.stringify(Array.from(dismissedNotifications)))
  }, [dismissedNotifications])

  // Memoized search filtering
  const filteredImports = useMemo(() => {
    if (imports.length === 0) {
      return []
    }

    const lowercaseSearchTerm = searchTerm.toLowerCase().trim()

    if (!lowercaseSearchTerm) {
      return imports
    }

    const filtered = imports.filter(
      (importItem) =>
        importItem.programName?.toLowerCase().includes(lowercaseSearchTerm) ||
        importItem.name?.toLowerCase().includes(lowercaseSearchTerm) ||
        importItem.description?.toLowerCase().includes(lowercaseSearchTerm) ||
        importItem.spreadsheetId.toLowerCase().includes(lowercaseSearchTerm),
    )

    console.log(`[ImportPrograms] Filtered imports: ${filtered.length} of ${imports.length} match "${searchTerm}"`)
    return filtered
  }, [imports, searchTerm])

  // Handle name updates from the editable component
  const handleNameUpdate = (importId: string, newName: string) => {
    console.log("[ImportPrograms] Updating local name:", { importId, newName })
    setImports((prev) => prev.map((imp) => (imp.id === importId ? { ...imp, name: newName } : imp)))
  }

  // Extract spreadsheet ID from Google Sheets URL
  const extractSpreadsheetId = (url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  // Validate Google Sheets URL
  const isValidGoogleSheetsUrl = (url: string): boolean => {
    return url.includes("docs.google.com/spreadsheets") && extractSpreadsheetId(url) !== null
  }

  // Get status badge variant and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ready_for_conversion":
        return { variant: "secondary" as const, text: "Queued", className: "bg-yellow-50 text-yellow-700" }
      case "processing":
        return { variant: "secondary" as const, text: "Processing", className: "bg-blue-50 text-blue-700" }
      case "conversion_complete":
        return { variant: "secondary" as const, text: "Ready", className: "bg-green-50 text-green-700" }
      case "reviewed": // New status
        return { variant: "secondary" as const, text: "Reviewed", className: "bg-green-50 text-green-700" }
      case "completed":
        return { variant: "secondary" as const, text: "Completed", className: "bg-green-50 text-green-700" }
      case "failed":
        return { variant: "secondary" as const, text: "Failed", className: "bg-red-50 text-red-700" }
      default:
        return { variant: "secondary" as const, text: "Unknown", className: "bg-gray-50 text-gray-700" }
    }
  }

  const handleConvert = async () => {
    if (!programNameInput.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both program name and Google Sheets link",
        variant: "destructive",
      })
      return
    }

    if (!googleSheetsLink.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both program name and Google Sheets link",
        variant: "destructive",
      })
      return
    }

    if (!isValidGoogleSheetsUrl(googleSheetsLink)) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheets URL.",
        variant: "destructive",
      })
      return
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to import programs.",
        variant: "destructive",
      })
      return
    }

    console.log("[ImportPrograms] Starting conversion for userId:", userId)
    setIsProcessing(true)
    setIsModalOpen(true)

    try {
      const spreadsheetId = extractSpreadsheetId(googleSheetsLink)

      if (!spreadsheetId) {
        throw new Error("Could not extract spreadsheet ID from URL")
      }

      console.log("[ImportPrograms] Creating new import document:", {
        userId,
        spreadsheetId,
        sheetsUrl: googleSheetsLink,
        name: programNameInput.trim(),
      })

      const docRef = await addDoc(collection(db, "sheets_imports"), {
        createdAt: serverTimestamp(),
        sheetsUrl: googleSheetsLink,
        spreadsheetId: spreadsheetId,
        status: "ready_for_conversion",
        updatedAt: serverTimestamp(),
        userId: userId,
        name: programNameInput.trim(),
      })

      console.log("[ImportPrograms] Document created with ID:", docRef.id)

      setGoogleSheetsLink("")
      setProgramNameInput("")

      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
    } catch (error) {
      console.error("[ImportPrograms] Error creating document:", error)
      setIsProcessing(false)
      setIsModalOpen(false)
      toast({
        title: "Error",
        description: "Failed to start conversion. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format program names for the toast
  const formatProgramName = (importItem: SheetsImport) => {
    return importItem.programName || importItem.name || `Spreadsheet ${importItem.spreadsheetId.slice(0, 12)}...`
  }

  // Show completion toast
  const showCompletionToast = (newlyCompleted: SheetsImport[]) => {
    const title =
      newlyCompleted.length === 1
        ? `Your Program "${formatProgramName(newlyCompleted[0])}" Is Ready!`
        : `${newlyCompleted.length} Programs Are Ready!`

    const toastId = toast.success({
      title,
      message:
        "Your workout program is now good to go! Review it, edit if needed, and you're all set to send it out. 💪",
      duration: null,
      pages: ["/programs", "/import-programs", "/demo/programs", "/demo/import-programs"],
      ctaButton: {
        text: "Show Me",
        onClick: () => {
          if (window.location.pathname !== "/import-programs") {
            router.push("/import-programs")
            setTimeout(() => {
              const importsSection = document.querySelector('[data-section="previously-imported"]')
              if (importsSection) {
                importsSection.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            }, 100)
          } else {
            const importsSection = document.querySelector('[data-section="previously-imported"]')
            if (importsSection) {
              importsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          }

          const newDismissed = new Set(dismissedNotifications)
          newlyCompleted.forEach((imp) => {
            newDismissed.add(imp.id)
          })
          setDismissedNotifications(newDismissed)
          setActiveToastId(null)
        },
      },
    })

    setActiveToastId(toastId)
  }

  // Handle review button click
  const handleReviewClick = (importItem: SheetsImport) => {
    console.log("[ImportPrograms] Review clicked for:", importItem.id)
    router.push(`/import-programs/${importItem.id}`)
  }

  const loadImportedPrograms = async () => {
    try {
      // This would fetch from your API
      const mockPrograms: ImportedProgram[] = [
        {
          id: "1",
          name: "tfhtegtd",
          status: "Queued",
          createdAt: new Date().toISOString(),
        },
      ]
      setImportedPrograms(mockPrograms)
    } catch (error) {
      console.error("Error loading programs:", error)
    }
  }

  const filteredPrograms = importedPrograms.filter((program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  console.log("[ImportPrograms] Render state:", {
    userId,
    isCheckingAuth,
    isLoadingImports,
    totalImports: imports.length,
    completedImports: completedImports.length,
    filteredImports: filteredImports.length,
    activeToastId,
    showInstructionsDialog, // Added for debugging
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#CCFF00] rounded-full mb-4">
            <Grid3X3 className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Your Workout Program</h1>
          <p className="text-gray-600">
            Paste your Google Sheets link. We'll turn it into a structured program for your client.
          </p>
        </div>

        {/* Import Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>Enter the program name and Google Sheets link to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="program-name">
                Program Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="program-name"
                placeholder="e.g., My Client's Strength Program"
                value={programNameInput}
                onChange={(e) => setProgramNameInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheets-link">
                Google Sheets Link <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sheets-link"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetsLink}
                onChange={(e) => setGoogleSheetsLink(e.target.value)}
                onFocus={() => {
                  if (!doNotShowInstructionsAgain) {
                    setShowInstructionsDialog(true)
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                You can still review and edit it before you send it to your clients in the Juice mobile app.
              </p>
              <Button
                onClick={handleConvert}
                disabled={isProcessing || !googleSheetsLink.trim() || !programNameInput.trim()}
                className="bg-[#CCFF00] text-black hover:bg-[#b8e600] font-medium"
              >
                {isProcessing ? "Converting..." : "Convert"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previously Imported Programs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Previously Imported Programs</CardTitle>
                <CardDescription>View and manage your imported workout programs</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingImports ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-lime-400 rounded-full mx-auto mb-4"></div>
                <p className="text-[14px] text-gray-500 font-inter">Loading your imports...</p>
              </div>
            ) : filteredImports.length > 0 ? (
              <div className="space-y-3">
                {filteredImports.map((importItem) => {
                  const statusInfo = getStatusInfo(importItem.status)
                  const isReady = importItem.status === "conversion_complete"
                  const isReviewed = importItem.status === "reviewed"
                  const isEditable = isReady || isReviewed
                  const { date, dayName } = formatImportDate(importItem.createdAt)

                  return (
                    <div
                      key={importItem.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <EditableProgramName importItem={importItem} onNameUpdate={handleNameUpdate} />
                        {date && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[12px] text-gray-500 font-inter">{dayName}</span>
                            <span className="text-[12px] text-gray-400 font-inter">•</span>
                            <span className="text-[12px] text-gray-500 font-inter">{date}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={statusInfo.variant}
                          className={`text-[12px] font-normal font-inter ${statusInfo.className}`}
                        >
                          {statusInfo.text}
                        </Badge>
                        <Button
                          onClick={() => handleReviewClick(importItem)}
                          disabled={!isEditable}
                          className="bg-black hover:bg-gray-800 text-white font-normal text-[14px] font-sen px-4 py-2 h-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isReviewed ? "Edit" : "Review"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No programs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions Dialog - Moved here */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="sm:max-w-lg font-inter">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                <div className="w-3 h-3 bg-amber-600 rounded-sm"></div>
              </div>
              <h3 className="font-semibold text-gray-900 text-[16px]">How to get your Google Sheets link:</h3>
            </div>
            <ol className="space-y-4 text-[14px] text-gray-700">
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">1.</span>
                <span>Open your workout program in Google Sheets.</span>
              </li>
              <li className="flex flex-col items-start">
                <div className="flex items-start">
                  <span className="font-medium text-blue-600 mr-2">2.</span>
                  <span>Click "Share" → "Anyone with the link can view".</span>
                </div>
                <img
                  src="/google-sheets-share-dialog.png"
                  alt="Google Sheets Share Dialog"
                  className="mt-3 rounded-md border shadow-sm max-w-full h-auto"
                />
              </li>
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">3.</span>
                <span>Paste the link into the field above.</span>
              </li>
            </ol>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("doNotShowInstructionsAgain", "true")
                setDoNotShowInstructionsAgain(true)
                setShowInstructionsDialog(false)
              }}
              className="text-[14px] font-inter"
            >
              Don't show me again
            </Button>
            <Button
              onClick={() => setShowInstructionsDialog(false)}
              className="bg-black hover:bg-gray-800 text-white text-[14px] font-inter"
            >
              Ok Thanks
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
