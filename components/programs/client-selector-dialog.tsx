"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, User } from "lucide-react"
import type { Client } from "@/types/client"

interface ClientSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientSelect: (client: Client) => void
  trainerId: string
}

export function ClientSelectorDialog({ open, onOpenChange, onClientSelect, trainerId }: ClientSelectorDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open && trainerId) {
      fetchClients()
    }
  }, [open, trainerId])

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clients)
    }
  }, [clients, searchTerm])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients?trainerId=${trainerId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }

      const data = await response.json()

      // Only show active clients who have user accounts (userId exists)
      const activeClientsWithAccounts = data.filter((client: Client) => client.status === "Active" && client.userId)

      setClients(activeClientsWithAccounts)
    } catch (error) {
      console.error("Error fetching clients:", error)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientSelect = (client: Client) => {
    onClientSelect(client)
    onOpenChange(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? "No clients found matching your search" : "No active clients with accounts found"}
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleClientSelect(client)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-200">
                      {client.initials || client.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                    <p className="text-sm text-gray-500 truncate">{client.email}</p>
                  </div>
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
