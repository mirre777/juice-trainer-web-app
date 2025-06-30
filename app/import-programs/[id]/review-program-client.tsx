"use client"

import { DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from "@/components/ui/dialog"
import { User } from "@/components/icons/user" // Assuming User is an icon component
import { useState } from "react"

const ReviewProgramClient = () => {
  const [showClientSelectionDialog, setShowClientSelectionDialog] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [showSendProgramDialog, setShowSendProgramDialog] = useState(false)

  return (
    {/* Client Selection Dialog */}
  \
    <Dialog open=
  showClientSelectionDialog
  onOpenChange =
    { setShowClientSelectionDialog } >
    (
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Client</DialogTitle>
          <DialogDescription>Choose which client to send this program to.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* This would be populated with actual clients from your API */}
          <div className="space-y-2">
            <Button
              variant={selectedClientId === "client1" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedClientId("client1")}
            >
              <User className="h-4 w-4 mr-2" />
              Emilie Rentinger
            </Button>
            <Button
              variant={selectedClientId === "client2" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedClientId("client2")}
            >
              <User className="h-4 w-4 mr-2" />
              John Smith
            </Button>
            {/* Add more clients as needed */}
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowClientSelectionDialog(false)}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (selectedClientId) {
              setShowClientSelectionDialog(false)
              setShowSendProgramDialog(true)
            }
          }}
          disabled={!selectedClientId}
        >
          Continue
        </Button>
      </DialogContent>
    )
  </Dialog>
  )
}

export default ReviewProgramClient
