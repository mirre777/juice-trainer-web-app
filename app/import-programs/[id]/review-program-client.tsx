"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Send, CheckCircle, AlertCircle, User } from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  email: string
  status: string
  avatar?: string
  createdAt: string
}

interface ProgramData {
  id: string
  name: string
  description?: string
  weeks: any[]
  createdAt: string
}

export default function ReviewProgramClient() {
  const params = useParams()
  const router = useRouter()
  const [program, setProgram] = useState<ProgramData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [showClientSelection, setShowClientSelection] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    loadProgram()
  }, [params.id])

  const loadProgram = async () => {
    try {
      const response = await fetch(`/api/sheets-imports/${params.id}`)
      if (!response.ok) throw new Error("Failed to load program")

      const data = await response.json()
      setProgram(data.program)
    } catch (error) {
      console.error("Error loading program:", error)
      toast.error("Failed to load program")
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    setIsLoadingClients(true)
    try {
      console.log("[loadClients] Fetching clients...")
      const response = await fetch("/api/clients")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[loadClients] Response:", data)

      if (data.success) {
        setClients(data.clients || [])
        console.log("[loadClients] Loaded clients:", data.clients?.length || 0)
      } else {
        throw new Error(data.error || "Failed to load clients")
      }
    } catch (error) {
      console.error("[loadClients] Error:", error)
      toast.error("Failed to load clients")
      setClients([])
    } finally {
      setIsLoadingClients(false)
    }
  }

  const handleSendToClient = () => {
    setShowClientSelection(true)
    loadClients()
  }

  const handleAssignProgram = async () => {
    if (!selectedClient || !program) return

    setIsAssigning(true)
    try {
      const response = await fetch("/api/programs/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programId: program.id,
          clientId: selectedClient,
          programData: program,
        }),
      })

      if (!response.ok) throw new Error("Failed to assign program")

      const data = await response.json()
      if (data.success) {
        toast.success("Program assigned successfully!")
        router.push("/programs")
      } else {
        throw new Error(data.error || "Failed to assign program")
      }
    } catch (error) {
      console.error("Error assigning program:", error)
      toast.error("Failed to assign program")
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading program...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Program Not Found</h2>
          <p className="text-gray-600 mb-4">The program you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Import Programs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/import-programs")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Program</h1>
              <p className="text-gray-600">Review and assign your imported program</p>
            </div>
          </div>
        </div>

        {/* Program Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {program.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {program.description && <p className="text-gray-600 mb-4">{program.description}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{program.weeks?.length || 0} weeks</span>
              <span>•</span>
              <span>Created {new Date(program.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button onClick={handleSendToClient} className="bg-lime-500 hover:bg-lime-600 text-white">
            <Send className="mr-2 h-4 w-4" />
            Send to Client
          </Button>
          <Button variant="outline">Preview Program</Button>
        </div>

        {/* Client Selection */}
        {showClientSelection && (
          <Card className="border-lime-200 bg-lime-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-lime-600" />
                Select Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingClients ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading clients...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any clients yet. Create a client first to assign this program.
                  </p>
                  <Button onClick={() => router.push("/clients")} variant="outline">
                    Go to Clients
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Found {clients.length} client{clients.length !== 1 ? "s" : ""}. Select one to assign this program:
                  </p>

                  <div className="grid gap-3">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedClient === client.id
                            ? "border-lime-500 bg-lime-100"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => setSelectedClient(client.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {client.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{client.name}</h4>
                              <p className="text-sm text-gray-600">{client.email}</p>
                            </div>
                          </div>
                          <Badge
                            variant={client.status === "active" ? "default" : "secondary"}
                            className={client.status === "active" ? "bg-green-100 text-green-800" : ""}
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedClient && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleAssignProgram}
                        disabled={isAssigning}
                        className="w-full bg-lime-500 hover:bg-lime-600 text-white"
                      >
                        {isAssigning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Assigning Program...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Assign Program to Client
                          </>
                        )}
                      </Button>
                    </div>
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
