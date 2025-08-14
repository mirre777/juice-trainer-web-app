"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast-context"
import { getCookie } from "cookies-next"
import type { Client } from "@/types/client"

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  onClientUpdated?: (client: Client) => void
}

export function EditClientModal({
  isOpen,
  onClose,
  client,
  onClientUpdated,
}: EditClientModalProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Populate form with client data when modal opens
  useEffect(() => {
    if (client && isOpen) {
      setName(client.name || "")
      setEmail(client.email || "")
      setPhone(client.phone || "")
      setErrors({})
      setErrorMessage(null)
    }
  }, [client, isOpen])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) newErrors.name = "Name is required"
    return newErrors
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setErrors({})
    setErrorMessage(null)
  }

  const handleSubmit = async () => {
    if (!client) return

    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const userId = getCookie("user_id")?.toString()
      if (!userId) {
        throw new Error("Please log in again")
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || "",
          phone: phone.trim() || "",
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const updatedClient = {
          ...client,
          name: name.trim(),
          email: email.trim() || "",
          phone: phone.trim() || "",
        }

        toast.success({
          title: "Client Updated",
          message: "Client information updated successfully!",
        })

        if (onClientUpdated) {
          onClientUpdated(updatedClient)
        }

        onClose()
        resetForm()
      } else {
        throw new Error(data.error || "Failed to update client")
      }
    } catch (error: any) {
      console.error("Error updating client:", error)
      setErrorMessage(error.message || "Failed to update client")
      toast.error({
        title: "Error",
        message: error.message || "Failed to update client",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Client</DialogTitle>
          <DialogDescription className="text-sm">
            Update your client's information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName" className="text-sm">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone" className="text-sm">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
