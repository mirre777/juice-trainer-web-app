"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import {
  Card,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  Input,
} from "@/components/ui"

const ReviewProgramClient = ({ programs, clients }) => {
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPeriodizationDialog, setShowPeriodizationDialog] = useState(false)
  const [periodizationAction, setPeriodizationAction] = useState("")
  const [numberOfWeeks, setNumberOfWeeks] = useState(4)
  const [selectedWeekToKeep, setSelectedWeekToKeep] = useState(1)
  const [programState, setProgramState] = useState({ weeks: [] })

  const createSafeClickHandler = (handler, action) => {
    return (event) => {
      event.preventDefault()
      handler()
    }
  }

  const handleSendToClient = () => {
    setIsSending(true)
    // Logic to send program to client
    setIsSending(false)
    setShowSendDialog(false)
  }

  const confirmLeave = () => {
    // Logic to confirm leave
    setShowConfirmDialog(false)
  }

  const confirmPeriodizationChange = () => {
    // Logic to confirm periodization change
    setShowPeriodizationDialog(false)
  }

  return (
    <div>
      <div className="grid gap-4">
        {programs.length > 0 ? (
          <div>
            {programs.map((program) => (
              <Card key={program.id} className="p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{program.name}</h3>
                  <Button onClick={() => setShowSendDialog(true)}>Send to Client</Button>
                </div>
                {program.routines.length > 0 ? (
                  <div className="mt-4">
                    {program.routines.map((routine) => (
                      <div key={routine.id} className="mb-4">
                        <h4 className="text-md font-medium">{routine.name}</h4>
                        <div className="mt-2">
                          <Button variant="outline">Edit</Button>
                          <Button variant="outline" className="ml-2 bg-transparent">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600">No routines found in this program.</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600">No routines found in this program.</p>
          </div>
        )}
      </div>

      {/* Send to Client Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Program to Client</DialogTitle>
            <DialogDescription>Select a client and add a custom message to send the program.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client-select" className="text-right">
                Client
              </Label>
              <Select onValueChange={setSelectedClientId} defaultValue={selectedClientId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="custom-message" className="text-right">
                Custom Message
              </Label>
              <Textarea
                id="custom-message"
                className="col-span-3"
                placeholder="Add a custom message to the email"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={createSafeClickHandler(() => setShowSendDialog(false), "setShowSendDialog-close")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={createSafeClickHandler(handleSendToClient, "handleSendToClient")}
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Leave Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Navigation</DialogTitle>
            <DialogDescription>You have unsaved changes. Are you sure you want to leave?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={createSafeClickHandler(() => setShowConfirmDialog(false), "setShowConfirmDialog-cancel")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={createSafeClickHandler(confirmLeave, "confirmLeave")}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Periodization Dialog */}
      <Dialog open={showPeriodizationDialog} onOpenChange={setShowPeriodizationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {periodizationAction === "to-periodized" ? "Convert to Periodized" : "Convert to Non-Periodized"}
            </DialogTitle>
            <DialogDescription>
              {periodizationAction === "to-periodized"
                ? "Enter the number of weeks for the periodized program."
                : "Select the week to use for the non-periodized program."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {periodizationAction === "to-periodized" ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number-of-weeks" className="text-right">
                  Number of Weeks
                </Label>
                <Input
                  id="number-of-weeks"
                  type="number"
                  min="1"
                  max="52"
                  className="col-span-3"
                  value={numberOfWeeks}
                  onChange={(e) => setNumberOfWeeks(Number.parseInt(e.target.value) || 4)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="week-select" className="text-right">
                  Select Week
                </Label>
                <Select
                  onValueChange={(value) => setSelectedWeekToKeep(Number.parseInt(value))}
                  defaultValue={String(selectedWeekToKeep)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a week" />
                  </SelectTrigger>
                  <SelectContent>
                    {programState.weeks?.map((week) => (
                      <SelectItem key={week.week_number} value={String(week.week_number)}>
                        Week {week.week_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={createSafeClickHandler(
                () => setShowPeriodizationDialog(false),
                "setShowPeriodizationDialog-cancel",
              )}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={createSafeClickHandler(confirmPeriodizationChange, "confirmPeriodizationChange")}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReviewProgramClient
