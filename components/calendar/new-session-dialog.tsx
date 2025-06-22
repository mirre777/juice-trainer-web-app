"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format, addHours, roundToNearestMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/toast-provider"

interface NewSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionCreated?: () => void
}

export function NewSessionDialog({ open, onOpenChange, onSessionCreated }: NewSessionDialogProps) {
  // Initialize with rounded current time + 1 hour
  const roundedNow = roundToNearestMinutes(new Date(), { nearestTo: 15 })
  const defaultStartTime = addHours(roundedNow, 1)
  const defaultEndTime = addHours(defaultStartTime, 1)

  const [title, setTitle] = useState("")
  const [clientId, setClientId] = useState("")
  const [sessionType, setSessionType] = useState("")
  const [date, setDate] = useState<Date | undefined>(defaultStartTime)
  const [startTime, setStartTime] = useState(format(defaultStartTime, "HH:mm"))
  const [endTime, setEndTime] = useState(format(defaultEndTime, "HH:mm"))
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()

  // Sample client data - in a real app, this would be fetched from your database
  const clients = [
    { id: "client1", name: "Ryan Wilson" },
    { id: "client2", name: "Alicia Johnson" },
    { id: "client3", name: "Michael Keaton" },
    { id: "client4", name: "Karen Lewis" },
  ]

  // Sample session types
  const sessionTypes = [
    { id: "training", name: "Training Session" },
    { id: "assessment", name: "Assessment" },
    { id: "consultation", name: "Consultation" },
    { id: "follow-up", name: "Follow-up" },
  ]

  const handleSubmit = async () => {
    // Basic validation
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!clientId) newErrors.clientId = "Client is required"
    if (!sessionType) newErrors.sessionType = "Session type is required"
    if (!date) newErrors.date = "Date is required"
    if (!startTime) newErrors.startTime = "Start time is required"
    if (!endTime) newErrors.endTime = "End time is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would send this data to your backend
      // For now, we'll just simulate a successful creation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success({
        title: "Session Created",
        description: "Your session has been scheduled successfully.",
      })

      // Reset form
      setTitle("")
      setClientId("")
      setSessionType("")
      setDate(defaultStartTime)
      setStartTime(format(defaultStartTime, "HH:mm"))
      setEndTime(format(defaultEndTime, "HH:mm"))
      setLocation("")
      setNotes("")

      // Close dialog and notify parent
      onOpenChange(false)
      if (onSessionCreated) onSessionCreated()
    } catch (err) {
      console.error("Error creating session:", err)
      toast.error({
        title: "Error",
        description: "Failed to create session. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(errors.title && "border-red-500")}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client" className={cn(errors.clientId && "border-red-500")}>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && <p className="text-sm text-red-500">{errors.clientId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-type">Session Type</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger id="session-type" className={cn(errors.sessionType && "border-red-500")}>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sessionType && <p className="text-sm text-red-500">{errors.sessionType}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                      errors.date && "border-red-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={cn(errors.startTime && "border-red-500")}
              />
              {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={cn(errors.endTime && "border-red-500")}
              />
              {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
