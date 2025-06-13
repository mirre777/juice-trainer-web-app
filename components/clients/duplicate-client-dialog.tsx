"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, User, ArrowRight } from "lucide-react"
import type { Client } from "@/types/client"

interface DuplicateClientDialogProps {
  isOpen: boolean
  onClose: () => void
  existingClient: Client
  newClientEmail: string
  onCreateAnyway: () => void
  onGoToClient: () => void
}

export function DuplicateClientDialog({
  isOpen,
  onClose,
  existingClient,
  newClientEmail,
  onCreateAnyway,
  onGoToClient,
}: DuplicateClientDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Client Already Exists
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm mb-3">
              A client with the email <strong>{newClientEmail}</strong> already exists in your client list.
            </p>

            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-sm text-gray-900">{existingClient.name}</h4>
                <p className="text-sm text-gray-600">{existingClient.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: <span className="capitalize">{existingClient.status}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-gray-700 font-medium text-sm">What would you like to do?</p>

            <div className="grid gap-3">
              <Button onClick={onGoToClient} variant="outline" className="flex items-center justify-between p-4 h-auto">
                <div className="text-left">
                  <div className="font-medium text-sm">Go to Existing Client</div>
                  <div className="text-sm text-gray-600">View and manage {existingClient.name}'s profile</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                onClick={onCreateAnyway}
                variant="outline"
                className="flex items-center justify-between p-4 h-auto border-amber-200 hover:bg-amber-50"
              >
                <div className="text-left">
                  <div className="font-medium text-sm">Create New Client Anyway</div>
                  <div className="text-sm text-gray-600">Create a duplicate client profile</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
