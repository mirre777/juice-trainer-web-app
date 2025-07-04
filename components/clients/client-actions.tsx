"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, MessageSquare, UserCheck } from "lucide-react"
import { UnifiedClientService } from "@/lib/services/unified-client-service"
import { useToast } from "@/hooks/use-toast"
import { DeleteClientDialog } from "./delete-client-dialog"
import type { Client } from "@/types/client"

interface ClientActionsProps {
  client: Client
  onClientDeleted?: () => void
  onClientUpdated?: () => void
}

export function ClientActions({ client, onClientDeleted, onClientUpdated }: ClientActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDeleteClient = async () => {
    try {
      setIsDeleting(true)
      console.log(`🗑️ [ClientActions] Deleting client: ${client.id}`)

      // Use unified client service to delete client
      const clientResult = await UnifiedClientService.deleteClient(client.id)

      if (!clientResult.success) {
        console.error("❌ [ClientActions] Failed to delete client:", clientResult.error?.message)
        toast({
          title: "Error",
          description: clientResult.error?.message || "Failed to delete client",
          variant: "destructive",
        })
        return
      }

      console.log("✅ [ClientActions] Client deleted successfully")

      toast({
        title: "Client Deleted",
        description: clientResult.message || `${client.name} has been deleted successfully.`,
      })

      // Close dialog and notify parent
      setShowDeleteDialog(false)
      if (onClientDeleted) {
        onClientDeleted()
      }
    } catch (error: any) {
      console.error("💥 [ClientActions] Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the client.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditClient = () => {
    // TODO: Implement edit client functionality
    console.log("Edit client:", client.id)
    toast({
      title: "Coming Soon",
      description: "Edit client functionality will be available soon.",
    })
  }

  const handleMessageClient = () => {
    // TODO: Implement message client functionality
    console.log("Message client:", client.id)
    toast({
      title: "Coming Soon",
      description: "Message client functionality will be available soon.",
    })
  }

  const handleApproveClient = async () => {
    try {
      console.log(`✅ [ClientActions] Approving client: ${client.id}`)

      // Use unified client service to update client status
      const clientResult = await UnifiedClientService.updateClient(client.id, {
        status: "Active",
      })

      if (!clientResult.success) {
        console.error("❌ [ClientActions] Failed to approve client:", clientResult.error?.message)
        toast({
          title: "Error",
          description: clientResult.error?.message || "Failed to approve client",
          variant: "destructive",
        })
        return
      }

      console.log("✅ [ClientActions] Client approved successfully")

      toast({
        title: "Client Approved",
        description: `${client.name} has been approved and is now active.`,
      })

      if (onClientUpdated) {
        onClientUpdated()
      }
    } catch (error: any) {
      console.error("💥 [ClientActions] Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while approving the client.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditClient}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </DropdownMenuItem>

          {client.status === "Pending" && (
            <DropdownMenuItem onClick={handleApproveClient}>
              <UserCheck className="mr-2 h-4 w-4" />
              Approve Client
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleMessageClient}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Client
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteClientDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteClient}
        clientName={client.name}
        isDeleting={isDeleting}
      />
    </>
  )
}
