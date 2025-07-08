"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link, Users, AlertCircle, CheckCircle } from "lucide-react"

interface LinkingStatus {
  totalClients: number
  linkedClients: number
  unlinkedClients: number
  clientsWithoutEmail: number
  details: Array<{
    clientId: string
    name: string
    email?: string
    userId?: string
    isLinked: boolean
  }>
}

interface LinkingResult {
  success: boolean
  clientsProcessed: number
  clientsLinked: number
  errors: string[]
  details: Array<{
    clientId: string
    clientName: string
    clientEmail: string
    userId?: string
    action: "linked" | "already_linked" | "no_match" | "error"
    error?: string
  }>
}

export default function ClientLinkingAdmin() {
  const [status, setStatus] = useState<LinkingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [linkingResult, setLinkingResult] = useState<LinkingResult | null>(null)
  const { toast } = useToast()

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/link-clients", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        throw new Error("Failed to fetch status")
      }
    } catch (error) {
      console.error("Error fetching status:", error)
      toast({
        title: "Error",
        description: "Failed to fetch linking status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const linkAllClients = async () => {
    setIsLinking(true)
    setLinkingResult(null)

    try {
      const response = await fetch("/api/admin/link-clients", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "link-all" }),
      })

      if (response.ok) {
        const result = await response.json()
        setLinkingResult(result)

        toast({
          title: "Linking Complete",
          description: `Linked ${result.clientsLinked} out of ${result.clientsProcessed} clients`,
        })

        // Refresh status
        await fetchStatus()
      } else {
        throw new Error("Failed to link clients")
      }
    } catch (error) {
      console.error("Error linking clients:", error)
      toast({
        title: "Error",
        description: "Failed to link clients",
        variant: "destructive",
      })
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Client Linking Admin
          </CardTitle>
          <CardDescription>Manage the linking between client documents and user accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchStatus} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Check Status
            </Button>
            <Button onClick={linkAllClients} disabled={isLinking || !status} variant="default">
              {isLinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Link All Clients
            </Button>
          </div>

          {status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{status.totalClients}</div>
                <div className="text-sm text-gray-500">Total Clients</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{status.linkedClients}</div>
                <div className="text-sm text-gray-500">Linked</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{status.unlinkedClients}</div>
                <div className="text-sm text-gray-500">Unlinked</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{status.clientsWithoutEmail}</div>
                <div className="text-sm text-gray-500">No Email</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {linkingResult && (
        <Card>
          <CardHeader>
            <CardTitle>Linking Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{linkingResult.clientsProcessed}</div>
                  <div className="text-sm text-gray-500">Processed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{linkingResult.clientsLinked}</div>
                  <div className="text-sm text-gray-500">Linked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{linkingResult.errors.length}</div>
                  <div className="text-sm text-gray-500">Errors</div>
                </div>
              </div>

              {linkingResult.details.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Details:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {linkingResult.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                          <span className="font-medium">{detail.clientName}</span>
                          <span className="text-gray-500 ml-2">{detail.clientEmail}</span>
                        </div>
                        <Badge
                          variant={
                            detail.action === "linked"
                              ? "default"
                              : detail.action === "already_linked"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {detail.action}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {status && status.details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {status.details.map((client) => (
                <div key={client.clientId} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div>
                    <span className="font-medium">{client.name}</span>
                    <span className="text-gray-500 ml-2">{client.email || "No email"}</span>
                  </div>
                  <Badge variant={client.isLinked ? "default" : "destructive"}>
                    {client.isLinked ? "Linked" : "Unlinked"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
