"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { handleClientError, type AppError } from "@/lib/utils/error-handler"
import { useToast } from "@/hooks/use-toast"

export function ErrorHandlingExample() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const { toast } = useToast()

  const handleRiskyOperation = async () => {
    setLoading(true)
    setError(null)

    try {
      // Your async operation here
      const response = await fetch("/api/some-endpoint")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      // Handle success
      toast({
        title: "Success!",
        description: "Operation completed successfully",
      })
    } catch (err) {
      // Use our error handler
      const appError = handleClientError(err, {
        component: "ErrorHandlingExample",
        operation: "handleRiskyOperation",
      })

      setError(appError)

      // Show toast notification with the error
      toast({
        title: "Error",
        description: appError.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleRiskyOperation} disabled={loading}>
        {loading ? "Processing..." : "Perform Operation"}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <p className="font-medium">{error.message}</p>
          <p className="text-sm text-red-600">Error code: {error.type}</p>
        </div>
      )}
    </div>
  )
}
