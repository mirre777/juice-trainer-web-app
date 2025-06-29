"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Image from "next/image"

interface SheetsImportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SheetsImportDialog({ isOpen, onClose }: SheetsImportDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Check if user has permanently dismissed
      const permanentlyDismissed = localStorage.getItem("sheets-instructions-dismissed") === "true"
      if (permanentlyDismissed) {
        return
      }

      // Check if dismissed in this session
      const sessionDismissed = sessionStorage.getItem("sheets-instructions-session-dismissed") === "true"
      if (sessionDismissed) {
        return
      }

      setShowDialog(true)

      // Preload the image
      const img = new window.Image()
      img.onload = () => setImageLoaded(true)
      img.src = "/google-sheets-share-dialog.png"
    }
  }, [isOpen])

  const handleOkThanks = () => {
    sessionStorage.setItem("sheets-instructions-session-dismissed", "true")
    setShowDialog(false)
    onClose()
  }

  const handleDontShowAgain = () => {
    localStorage.setItem("sheets-instructions-dismissed", "true")
    setShowDialog(false)
    onClose()
  }

  const handleClose = () => {
    sessionStorage.setItem("sheets-instructions-session-dismissed", "true")
    setShowDialog(false)
    onClose()
  }

  if (!showDialog) return null

  return (
    <Dialog open={showDialog} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm">
              📊
            </span>
            How to get your Google Sheets link:
          </DialogTitle>
          <Button variant="ghost" size="sm" className="absolute right-4 top-4" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <p className="text-sm">Open your workout program in Google Sheets.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <p className="text-sm">Click "Share" → "Anyone with the link can view".</p>
            </div>

            {/* Image container with loading state */}
            <div className="ml-9 bg-gray-50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
              {!imageLoaded ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading image...</span>
                </div>
              ) : (
                <Image
                  src="/google-sheets-share-dialog.png"
                  alt="Google Sheets sharing dialog"
                  width={600}
                  height={300}
                  className="rounded-lg shadow-sm"
                  priority
                />
              )}
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <p className="text-sm">Paste the link into the field above.</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleDontShowAgain} className="text-sm bg-transparent">
              Don't show me again
            </Button>
            <Button onClick={handleOkThanks} className="bg-black text-white hover:bg-gray-800">
              Ok Thanks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
