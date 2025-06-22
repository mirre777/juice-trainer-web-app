"use client"
import { Button } from "@/components/ui/button"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { deleteClient } from "@/lib/firebase/client-service"
import { useToast } from "@/hooks/use-toast"

interface ClientActionsProps {
  clientId: string
  onSuccess?: () => void
}

export function ClientActions({ clientId, onSuccess }: ClientActionsProps) {
  const { error, loading, executeWithErrorHandling } = useErrorHandler({
    context: { component: "ClientActions", clientId },
  })
  const { toast } = useToast()

  const handleDeleteClient = async () => {
    const success = await executeWithErrorHandling(async () => {
      await deleteClient(clientId)
      return true
    })

    if (success) {
      toast({
        title: "Client deleted",
        description: "The client has been successfully removed",
      })

      if (onSuccess) {
        onSuccess()
      }
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="destructive" onClick={handleDeleteClient} disabled={loading}>
        {loading ? "Deleting..." : "Delete Client"}
      </Button>

      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  )
}
