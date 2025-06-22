"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendProgramToClient } from "@/app/actions/program-assignment-actions"
import { useCurrentUser } from "@/hooks/use-current-user" // To get the trainer's ID
import type { Client } from "@/types/client" // Assuming you have a Client type
import type { WorkoutProgram } from "@/types/workout-program"

interface AssignProgramDialogProps {
  isOpen: boolean
  onClose: () => void
  program: WorkoutProgram | null
}

export function AssignProgramDialog({ isOpen, onClose, program }: AssignProgramDialogProps) {
  const { toast } = useToast()
  const { user: trainer } = useCurrentUser() // Get current trainer's user data
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (isOpen && trainer?.uid) {
      fetchClients(trainer.uid)
    } else if (!trainer?.uid) {
      // Handle case where trainer UID is not available (e.g., not logged in)
      setLoadingClients(false)
      toast({
        title: "Authentication Error",
        description: "Could not retrieve trainer information. Please log in again.",
        variant: "destructive",
      })
    }
  }, [isOpen, trainer?.uid, toast])

  const fetchClients = async (trainerId: string) => {
    setLoadingClients(true)
    try {
      // Assuming an API route to fetch clients for the current trainer
      const response = await fetch(`/api/clients?trainerId=${trainerId}`)
      const data = await response.json()

      if (response.ok) {
        setClients(data.clients || [])
        if (data.clients.length > 0) {
          setSelectedClientId(data.clients[0].id) // Select first client by default
        }
      } else {
        console.error("Failed to fetch clients:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load clients.",
          variant: "destructive",
        })
        setClients([])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching clients.",
        variant: "destructive",
      })
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  const handleAssign = async () => {
    if (!program || !selectedClientId) {
      toast({
        title: "Error",
        description: "Please select a program and a client.",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    try {
      const result = await sendProgramToClient(program, selectedClientId)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error assigning program:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during program assignment.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Assign Program to Client</DialogTitle>
          <DialogDescription>
            Select a client to assign the program: <strong>{program?.program_title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loadingClients ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading clients...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No clients found.</div>
          ) : (
            <RadioGroup value={selectedClientId} onValueChange={setSelectedClientId}>
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <RadioGroupItem value={client.id} id={client.id} />
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">{getInitials(client.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={client.id} className="font-medium cursor-pointer block truncate">
                      {client.name}
                    </Label>
                    {client.email && <p className="text-xs text-gray-500 truncate">{client.email}</p>}
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isAssigning || !selectedClientId || !program}>
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              "Assign Program"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
