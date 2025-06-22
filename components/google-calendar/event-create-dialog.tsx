"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format, addHours, roundToNearestMinutes, set } from "date-fns"
import { useToast } from "@/components/toast-provider"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGoogleAuth } from "@/lib/client-token-service"

interface EventCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCalendarId: string | null
  availableCalendars: Array<{ id: string; name: string }>
  onEventCreated: () => void
}

export function EventCreateDialog({
  open,
  onOpenChange,
  selectedCalendarId,
  availableCalendars,
  onEventCreated,
}: EventCreateDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [calendarId, setCalendarId] = useState(selectedCalendarId || "")

  // Initialize with rounded current time + 1 hour
  const roundedNow = roundToNearestMinutes(new Date(), { nearestTo: 15 })
  const defaultStartTime = addHours(roundedNow, 1)
  const defaultEndTime = addHours(defaultStartTime, 1)

  const [date, setDate] = useState<Date | undefined>(defaultStartTime)
  const [startTime, setStartTime] = useState(format(defaultStartTime, "HH:mm"))
  const [endTime, setEndTime] = useState(format(defaultEndTime, "HH:mm"))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const { accessToken, isAuthenticated } = useGoogleAuth()

  const handleSubmit = async () => {
    // Basic validation
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!date) newErrors.date = "Date is required"
    if (!startTime) newErrors.startTime = "Start time is required"
    if (!endTime) newErrors.endTime = "End time is required"
    if (!calendarId) newErrors.calendarId = "Calendar is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!accessToken || !isAuthenticated) {
      toast.error({
        title: "Error",
        description: "You need to be connected to Google Calendar to create events.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format start and end dateTime in ISO format
      const startDateTime = formatDateTime(date!, startTime)
      const endDateTime = formatDateTime(date!, endTime)

      // Prepare the event data
      const eventData = {
        summary: title,
        description,
        location,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }

      // Send the request to Google Calendar API
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`)
      }

      // On success, reset form and notify
      toast.success({
        title: "Event Created",
        description: "Your event has been added to the calendar.",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setLocation("")
      setDate(defaultStartTime)
      setStartTime(format(defaultStartTime, "HH:mm"))
      setEndTime(format(defaultEndTime, "HH:mm"))

      // Close dialog and notify parent
      onOpenChange(false)
      onEventCreated()
    } catch (err: any) {
      console.error("Error creating event:", err)
      toast.error({
        title: "Error",
        description: "Failed to create event. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to format date and time into ISO format
  const formatDateTime = (date: Date, timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const dateTime = set(date, { hours, minutes })
    return dateTime.toISOString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Calendar Event</DialogTitle>
          <DialogDescription>Add a new event to your Google Calendar.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="calendar">Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger id="calendar" className={cn(errors.calendarId && "border-red-500")}>
                <SelectValue placeholder="Select a calendar" />
              </SelectTrigger>
              <SelectContent>
                {availableCalendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.calendarId && <p className="text-sm text-red-500">{errors.calendarId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(errors.title && "border-red-500")}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
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
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
              "Create Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
