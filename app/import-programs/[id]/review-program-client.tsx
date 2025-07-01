"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Users, AlertCircle, CheckCircle2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import LoadingSpinner from "@/components/shared/loading-spinner"
import type { Client } from "@/types/client"

interface ReviewProgramClientProps {
  programId: string
  programData: any
}

export default function ReviewProgramClient({ programId, programData }: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showClientSelection, setShowClientSelection] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [assigning, setAssigning] = useState(false)

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      console.log("[fetchClients] Fetching trainer's clients...")
      const response = await fetch("/api/clients")
      const data = await response.json()

      console.log("[fetchClients] Response:", data)

      if (data.success) {
        setClients(data.clients || [])
        console.log("[fetchClients] Loaded", data.clients?.length || 0, "clients")
      } else {
        console.error("[fetchClients] Failed to fetch clients:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load clients",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[fetchClients] Error:", error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSendToClient = () => {
    setShowClientSelection(true)
    fetchClients()
  }

  const handleAssignProgram = async () => {
    if (!selectedClientId) {
      toast({
        title: "No client selected",
        description: "Please select a client to assign the program to.",
        variant: "destructive",
      })
      return
    }

    setAssigning(true)
    try {
      const response = await fetch("/api/programs/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programId,
          clientId: selectedClientId,
          programData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Program assigned!",
          description: "The program has been successfully assigned to your client.",
        })
        router.push("/programs")
      } else {
        toast({
          title: "Assignment failed",
          description: data.error || "Failed to assign program to client.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error assigning program:", error)
      toast({
        title: "Error",
        description: "Failed to assign program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  const selectedClient = clients.find((client) => client.id === selectedClientId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Program</h1>
            <p className="text-gray-600">Review and assign your imported program</p>
          </div>
        </div>

        {/* Program Preview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Program Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{programData?.name || "Imported Program"}</h3>
                <p className="text-gray-600">{programData?.description || "No description available"}</p>
              </div>

              {programData?.weeks && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{programData.weeks.length} weeks</span>
                  <span>•</span>
                  <span>
                    {programData.weeks.reduce((total: number, week: any) => total + (week.routines?.length || 0), 0)}{" "}
                    total workouts
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Badge variant="secondary">Ready to assign</Badge>
                <Badge variant="outline">Imported from Google Sheets</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button onClick={handleSendToClient} className="bg-primary hover:bg-primary/90" disabled={loadingClients}>
            <Send className="mr-2 h-4 w-4" />
            Send to Client
          </Button>
          <Button variant="outline" onClick={() => router.push("/programs")}>
            Save for Later
          </Button>
        </div>

        {/* Client Selection Section */}
        {showClientSelection && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="py-8">
                  <LoadingSpinner />
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
                  <p className="text-gray-600 mb-4">You need to have clients to assign programs to them.</p>
                  <Button onClick={() => router.push("/clients?addClient=true")} variant="outline">
                    Add Your First Client
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Found {clients.length} client{clients.length !== 1 ? "s" : ""}. Select one to assign this program:
                  </p>

                  <div className="grid gap-3">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedClientId === client.id
                            ? "border-primary bg-primary/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{client.name}</h4>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={client.status === "Active" ? "default" : "secondary"} className="text-xs">
                              {client.status}
                            </Badge>
                            {selectedClientId === client.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedClient && (
                    <>
                      <Separator />
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium mb-2">Assignment Summary</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          You're about to assign "<strong>{programData?.name || "Imported Program"}</strong>" to{" "}
                          <strong>{selectedClient.name}</strong>.
                        </p>
                        <Button onClick={handleAssignProgram} disabled={assigning} className="w-full">
                          {assigning ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Assigning Program...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Assign Program to {selectedClient.name}
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
