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
  const [shouldShowDialog, setShouldShowDialog] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Check if user has permanently dismissed this dialog
      const dontShowAgain = localStorage.getItem("dontShowSheetsInstructions")
      if (dontShowAgain === "true") {
        onClose()
        return
      }

      // Check if user has seen this dialog in current session
      const hasSeenThisSession = sessionStorage.getItem("hasSeenSheetsInstructions")
      if (hasSeenThisSession === "true") {
        onClose()
        return
      }

      // Reset image loaded state when dialog opens
      setImageLoaded(false)
      setShouldShowDialog(false)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    // Only show dialog when image is loaded and dialog should be open
    if (isOpen && imageLoaded) {
      setShouldShowDialog(true)
    }
  }, [isOpen, imageLoaded])

  const handleClose = () => {
    // Mark as seen in current session
    sessionStorage.setItem("hasSeenSheetsInstructions", "true")
    setShouldShowDialog(false)
    onClose()
  }

  const handleDontShowAgain = () => {
    // Mark as permanently dismissed
    localStorage.setItem("dontShowSheetsInstructions", "true")
    sessionStorage.setItem("hasSeenSheetsInstructions", "true")
    setShouldShowDialog(false)
    onClose()
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <>
      {/* Preload image when dialog should be open */}
      {isOpen && (
        <div style={{ display: "none" }}>
          <Image
            src="/google-sheets-share-dialog.png"
            alt="Google Sheets sharing dialog"
            width={600}
            height={400}
            onLoad={handleImageLoad}
            priority
          />
        </div>
      )}

      <Dialog open={shouldShowDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                How to get your Google Sheets link:
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <p className="text-gray-700">Open your workout program in Google Sheets.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <p className="text-gray-700">Click "Share" → "Anyone with the link can view".</p>
              </div>
            </div>

            {imageLoaded && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <Image
                  src="/google-sheets-share-dialog.png"
                  alt="Google Sheets sharing dialog"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded border"
                />
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <p className="text-gray-700">Paste the link into the field above.</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleDontShowAgain}>
              Don't show me again
            </Button>
            <Button onClick={handleClose}>Ok Thanks</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
