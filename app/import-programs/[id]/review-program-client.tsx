"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Calendar, Send } from "lucide-react"
import { sendProgramToClient } from "@/app/actions/program-assignment-actions"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { WorkoutProgram } from "@/types/workout-program"

interface Client {
  id: string
  name: string
  email: string
  initials?: string
}

interface ReviewProgramClientProps {
  program: WorkoutProgram
  programId: string
}

export default function ReviewProgramClient({ program, programId }: ReviewProgramClientProps) {
  const router = useRouter()
  const { user, isTrainerLoading } = useCurrentUser()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [message, setMessage] = useState("")
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  // Fetch clients when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.uid) return

      try {
        const response = await fetch(`/api/clients?trainerId=${user.uid}`)
        if (response.ok) {
          const clientsData = await response.json()
          setClients(clientsData || [])
        } else {
          console.error("Failed to fetch clients")
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }

    if (user?.uid && !isTrainerLoading) {
      fetchClients()
    }
  }, [user?.uid, isTrainerLoading])

  const handleSendProgram = async () => {
    if (!selectedClientId || !program) {
      console.error("Missing required data for sending program")
      return
    }

    setIsSending(true)

    try {
      console.log("Sending program to client:", selectedClientId)
      console.log("Program data:", program)

      const result = await sendProgramToClient(program, selectedClientId)

      if (result.success) {
        console.log("Program sent successfully:", result)
        setShowSendDialog(false)
        setSelectedClientId("")
        setMessage("")
        // Show success message or redirect
        router.push("/programs?success=program-sent")
      } else {
        console.error("Failed to send program:", result.message)
        alert(`Failed to send program: ${result.message}`)
      }
    } catch (error) {
      console.error("Error sending program:", error)
      alert("An unexpected error occurred while sending the program.")
    } finally {
      setIsSending(false)
    }
  }

  const selectedClient = clients.find((client) => client.id === selectedClientId)

  if (isTrainerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Review Program</h1>
        <p className="text-gray-600">Review and send your workout program to clients</p>
      </div>

      {/* Program Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {program.title || "Untitled Program"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{program.weeks?.length || 0} weeks</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workouts</p>
              <p className="font-medium">
                {program.weeks?.reduce((total, week) => total + (week.routines?.length || 0), 0) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {program.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Program Notes</p>
              <p className="text-sm bg-gray-50 p-3 rounded">{program.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Content Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Program Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {program.weeks?.map((week, weekIndex) => (
              <div key={weekIndex} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Week {weekIndex + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {week.routines?.map((routine, routineIndex) => (
                    <Badge key={routineIndex} variant="outline" className="justify-start">
                      {routine.name || `Workout ${routineIndex + 1}`}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Edit
        </Button>
        <Button
          onClick={() => setShowSendDialog(true)}
          disabled={!clients.length}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          Send to Client
        </Button>
      </div>

      {/* Send Program Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Sending Program</DialogTitle>
            <p className="text-sm text-gray-600">You are about to send the following program:</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Program Summary */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold">{program.title || "Untitled Program"}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {user?.displayName || "Unknown Trainer"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2">
                  <Textarea
                    placeholder="Add a message to your client (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Client Selection */}
            <div>
              <Label className="text-base font-medium">Select Client:</Label>
              <RadioGroup
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                className="mt-2 max-h-48 overflow-y-auto"
              >
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                    <RadioGroupItem value={client.id} id={client.id} />
                    <Label htmlFor={client.id} className="flex items-center gap-2 cursor-pointer flex-1">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {client.initials || client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {clients.length === 0 && (
              <Alert>
                <AlertDescription>No clients found. Please add clients first before sending programs.</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription>
                We will send your client an email and app notification. They can still access their old program.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendProgram}
              disabled={!selectedClientId || isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Program"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
