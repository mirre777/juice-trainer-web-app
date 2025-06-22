"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, Sparkles, FileSpreadsheet, ChevronRight } from "lucide-react"
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from "firebase/firestore" // Import 'limit'
import { db } from "@/lib/firebase/firebase"
import { useEffect, useState, useMemo } from "react" // Import 'useMemo'
import { useToast } from "@/components/ui/toast-context"
import { useDebounce } from "@/hooks/use-debounce" // Import useDebounce

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
      className="text-[14px] font-medium text-black font-sen cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
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
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // Debounce search term
  const [programNameInput, setProgramNameInput] = useState("") // New state for program name
  const [googleSheetsLink, setGoogleSheetsLink] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [imports, setImports] = useState<SheetsImport[]>([])
  const [isLoadingImports, setIsLoadingImports] = useState(false)
  const [completedImports, setCompletedImports] = useState<SheetsImport[]>([])
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())
  const [activeToastId, setActiveToastId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[ImportPrograms] Checking authentication...")
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const userData = await response.json()
          const currentUserId = userData.uid || userData.id
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
      limit(50), // Limit results for pagination, as per docs
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
    const savedDismissed = localStorage.getItem("dismissedImportNotifications")
    if (savedDismissed) {
      try {
        const parsed = JSON.parse(savedDismissed)
        setDismissedNotifications(new Set(parsed))
      } catch (error) {
        console.error("[ImportPrograms] Error parsing saved dismissed notifications:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("dismissedImportNotifications", JSON.stringify(Array.from(dismissedNotifications)))
  }, [dismissedNotifications])

  // Memoized search filtering
  const filteredImports = useMemo(() => {
    if (imports.length === 0) {
      return []
    }

    const lowercaseSearchTerm = debouncedSearchTerm.toLowerCase().trim()

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

    console.log(
      `[ImportPrograms] Filtered imports: ${filtered.length} of ${imports.length} match "${debouncedSearchTerm}"`,
    )
    return filtered
  }, [imports, debouncedSearchTerm])

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
      // Check if program name is provided
      alert("Please enter a program name.")
      return
    }

    if (!googleSheetsLink.trim()) {
      alert("Please enter a Google Sheets link.")
      return
    }

    if (!isValidGoogleSheetsUrl(googleSheetsLink)) {
      alert("Please enter a valid Google Sheets URL.")
      return
    }

    if (!userId) {
      alert("You must be logged in to import programs.")
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
        name: programNameInput.trim(), // Include the program name
      })

      const docRef = await addDoc(collection(db, "sheets_imports"), {
        createdAt: serverTimestamp(),
        sheetsUrl: googleSheetsLink,
        spreadsheetId: spreadsheetId,
        status: "ready_for_conversion",
        updatedAt: serverTimestamp(),
        userId: userId,
        name: programNameInput.trim(), // Save the program name
      })

      console.log("[ImportPrograms] Document created with ID:", docRef.id)

      setGoogleSheetsLink("")
      setProgramNameInput("") // Clear the program name input after submission

      setTimeout(() => {
        setIsProcessing(false)
      }, 3000)
    } catch (error) {
      console.error("[ImportPrograms] Error creating document:", error)
      setIsProcessing(false)
      setIsModalOpen(false)
      alert("Failed to start conversion. Please try again.")
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
      duration: null, // Don't auto-dismiss
      pages: ["/programs", "/import-programs", "/demo/programs", "/demo/import-programs"], // Only show on program-related pages
      ctaButton: {
        text: "Show Me",
        onClick: () => {
          // Navigate to import-programs page if not already there
          if (window.location.pathname !== "/import-programs") {
            router.push("/import-programs")
            // Wait for navigation then scroll
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
            // Already on import-programs page, just scroll
            const importsSection = document.querySelector('[data-section="previously-imported"]')
            if (importsSection) {
              importsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          }

          // Mark as dismissed
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

  console.log("[ImportPrograms] Render state:", {
    userId,
    isCheckingAuth,
    isLoadingImports,
    totalImports: imports.length,
    completedImports: completedImports.length,
    filteredImports: filteredImports.length,
    activeToastId,
  })

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Import Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-green-600 rounded-sm flex items-center justify-center">
              <div className="grid grid-cols-3 gap-0.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white rounded-sm" />
                ))}
              </div>
            </div>
          </div>

          <h1 className="text-[32px] font-bold text-gray-900 mb-4 font-sen">Import Your Workout Program</h1>
          <p className="text-[18px] text-gray-500 mb-8 font-inter">
            Paste your Google Sheets link. We'll turn it into a structured program for your client.
          </p>

          <div className="max-w-2xl mx-auto mb-6">
            <label
              htmlFor="program-name"
              className="block text-left text-[14px] font-medium text-gray-700 mb-2 font-inter"
            >
              Program Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="program-name"
              type="text"
              placeholder="e.g., My Client's Strength Program"
              value={programNameInput}
              onChange={(e) => setProgramNameInput(e.target.value)}
              className="w-full h-12 text-[14px] font-inter border-2 rounded-lg placeholder-gray-400 mb-4"
              required
            />

            <label
              htmlFor="google-sheets-link"
              className="block text-left text-[14px] font-medium text-gray-700 mb-2 font-inter"
            >
              Google Sheets Link <span className="text-red-500">*</span>
            </label>
            <Input
              id="google-sheets-link"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={googleSheetsLink}
              onChange={(e) => setGoogleSheetsLink(e.target.value)}
              className="w-full h-12 text-[14px] font-inter border-2 rounded-lg placeholder-gray-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-center text-gray-500">
              <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
              <p className="text-[14px] font-inter">
                Our AI will convert it into a structured program that you can review, edit, and send to your clients in
                the Juice app.
              </p>
            </div>
            <Button
              onClick={handleConvert}
              disabled={isProcessing || !googleSheetsLink.trim() || !programNameInput.trim()}
              className="w-fit px-8 h-12 bg-primary hover:bg-primary/90 text-gray-700 font-medium text-[14px] font-sen rounded-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Convert"}
            </Button>
          </div>

          {/* Previously Imported Programs */}
          <Card className="p-8" data-section="previously-imported">
            <div className="border-t border-gray-100 pt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[18px] font-semibold text-gray-900 font-sen">Previously Imported Programs</h2>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-72 bg-gray-50 border-gray-200 text-[14px] font-inter focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {isLoadingImports && (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-lime-400 rounded-full mx-auto mb-4"></div>
                  <p className="text-[14px] text-gray-500 font-inter">Loading your imports...</p>
                </div>
              )}

              {!isLoadingImports && filteredImports.length === 0 && (
                <div className="text-center py-12">
                  <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-[18px] font-medium text-gray-900 mb-2 font-sen">No imports yet</h3>
                  <p className="text-[14px] text-gray-500 font-inter">
                    {searchTerm
                      ? "No imports match your search. Try a different search term."
                      : "Import your first Google Sheets workout program to get started."}
                  </p>
                </div>
              )}

              {!isLoadingImports && filteredImports.length > 0 && (
                <div className="space-y-4">
                  {filteredImports.map((importItem) => {
                    const statusInfo = getStatusInfo(importItem.status)
                    const isReady = importItem.status === "conversion_complete"
                    const isReviewed = importItem.status === "reviewed"
                    const isEditable = isReady || isReviewed
                    const { date, dayName } = formatImportDate(importItem.createdAt)

                    return (
                      <div key={importItem.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div className="flex-1 flex items-center space-x-3">
                          <div className="flex flex-col">
                            <EditableProgramName importItem={importItem} onNameUpdate={handleNameUpdate} />
                            {date && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[12px] text-gray-500 font-inter">{dayName}</span>
                                <span className="text-[12px] text-gray-400 font-inter">•</span>
                                <span className="text-[12px] text-gray-500 font-inter">{date}</span>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={statusInfo.variant}
                            className={`text-[12px] font-normal font-inter ${statusInfo.className}`}
                          >
                            {statusInfo.text}
                          </Badge>
                        </div>

                        <Button
                          onClick={() => handleReviewClick(importItem)}
                          disabled={!isEditable}
                          className="bg-black hover:bg-gray-800 text-white font-normal text-[14px] font-sen px-4 py-2 h-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isReviewed ? "Edit" : "Review"}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Processing Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md font-sen">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-lime-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                {isProcessing ? (
                  <svg
                    className="animate-spin h-8 w-8 text-lime-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-[24px] font-bold mb-4 text-gray-900">
                {isProcessing ? "Processing Your Workout Program" : "You are using the new version of our Import AI"}
              </h3>

              <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
                {isProcessing ? (
                  "We're converting your Google Sheet into a structured workout program. This may take a few moments."
                ) : (
                  <>
                    To ensure your Google Sheets data is converted accurately,{" "}
                    <span className="font-bold text-lime-600">we've added a manual review step.</span> Your structured
                    workout program will be ready for review within 24 hours.
                  </>
                )}
              </p>

              {isProcessing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div className="bg-lime-400 h-2.5 rounded-full w-3/4 animate-pulse"></div>
                </div>
              )}

              {!isProcessing && (
                <div className="mb-6">
                  <p className="text-[14px] text-blue-600 font-medium">
                    Note: You can import other programs while you wait.
                  </p>
                </div>
              )}

              {isProcessing && (
                <p className="text-[12px] text-gray-400">
                  Converting rows and columns into exercises, sets, and reps...
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
