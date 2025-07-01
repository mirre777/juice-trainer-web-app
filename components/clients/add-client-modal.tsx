"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"
import { createClient } from "@/lib/firebase/client-service"
import { toast } from "@/hooks/use-toast"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onAddClient?: (clientId: string) => void
  onGoToClient?: (clientId: string) => void
}

export function AddClientModal({ isOpen, onClose, onAddClient, onGoToClient }: AddClientModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "",
    notes: "",
    program: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to add clients",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Client name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("[AddClientModal] Creating client with data:", formData)

      const result = await createClient(user.uid, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        goal: formData.goal.trim(),
        notes: formData.notes.trim(),
        program: formData.program.trim(),
      })

      if (result.success && result.clientId) {
        console.log("[AddClientModal] Client created successfully:", result.clientId)

        toast({
          title: "Success",
          description: "Client added successfully!",
        })

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          goal: "",
          notes: "",
          program: "",
        })

        // Call callbacks
        onAddClient?.(result.clientId)
        onClose()

        // Optionally navigate to client
        if (onGoToClient) {
          onGoToClient(result.clientId)
        }
      } else {
        console.error("[AddClientModal] Failed to create client:", result.error)
        toast({
          title: "Error",
          description: result.error?.message || "Failed to add client",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[AddClientModal] Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Input
              id="goal"
              value={formData.goal}
              onChange={(e) => handleInputChange("goal", e.target.value)}
              placeholder="Client's fitness goal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            <Input
              id="program"
              value={formData.program}
              onChange={(e) => handleInputChange("program", e.target.value)}
              placeholder="Assigned program"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about the client"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
