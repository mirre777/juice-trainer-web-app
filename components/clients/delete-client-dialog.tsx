"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteClient } from "@/lib/firebase/client-service"
import { useToast } from "@/hooks/use-toast"
import { getCookie } from "cookies-next"

interface DeleteClientDialogProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  onDeleted?: () => void
}

export function DeleteClientDialog({ isOpen, onClose, clientId, clientName, onDeleted }: DeleteClientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const trainerId = getCookie("user_id") as string

      if (!trainerId) {
        toast({
          title: "Error",
          description: "You must be logged in to delete a client",
          variant: "destructive",
        })
        return
      }

      const success = await deleteClient(trainerId, clientId)

      if (success) {
        toast({
          title: "Client archived",
          description: `${clientName} has been archived.`,
        })
        if (onDeleted) onDeleted()
      } else {
        toast({
          title: "Error",
          description: "Failed to archive client. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Archive Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive {clientName}? The client will be marked as deleted but their data will be
            preserved for your records.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Archiving..." : "Archive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
