"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Save, RotateCcw, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Client } from "@/types/client"

interface ReviewProgramClientProps {
  programData: any
  importId: string
}

export default function ReviewProgramClient({ programData, importId }: ReviewProgramClientProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [showClientSelection, setShowClientSelection] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Fetch clients using API route
  const fetchClientsDirectly = async () => {
    console.log("[fetchClientsDirectly] === STARTING API CLIENT FETCH ===")
    setIsLoadingClients(true)
    setClientError(null)

    try {
      console.log("[fetchClientsDirectly] Calling /api/clients...")
      const response = await fetch("/api/clients", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      })

      console.log("[fetchClientsDirectly] API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[fetchClientsDirectly] API error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[fetchClientsDirectly] API response data:", data)

      if (data.success && data.clients) {
        console.log("[fetchClientsDirectly] ✅ Successfully fetched clients:", data.clients.length)
        setClients(data.clients)
        setClientError(null)
      } else {
        console.error("[fetchClientsDirectly] ❌ API returned error:", data.error)
        setClientError(data.error || "Failed to fetch clients")
        setClients([])
      }
    } catch (error) {
      console.error("[fetchClientsDirectly] ❌ Error occurred:", error)
      setClientError(error instanceof Error ? error.message : "Unknown error occurred")
      setClients([])
    } finally {
      setIsLoadingClients(false)
      console.log("[fetchClientsDirectly] === API CLIENT FETCH COMPLETE ===")
    }
  }

  // Fetch clients on component mount
  useEffect(() => {
    console.log("[ReviewProgramClient] Component mounted, calling fetchClients...")
    fetchClientsDirectly()
  }, [])

  const toggleClientSelection = () => {
    console.log("[toggleClientSelection] Current state:", {
      showClientSelection,
      hasChanges: false,
      isSaving: false,
      clientsLength: clients.length,
    })

    setShowClientSelection(!showClientSelection)
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // Implement save logic here
      console.log("Saving changes...")
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    } catch (error) {
      console.error("Error saving changes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendToClient = async () => {
    if (!selectedClientId) {
      alert("Please select a client first")
      return
    }

    setIsSending(true)
    try {
      // Implement send to client logic here
      console.log("Sending to client:", selectedClientId)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    } catch (error) {
      console.error("Error sending to client:", error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Program</h1>
              <p className="text-sm text-gray-600">Review and edit the imported workout program before saving</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Revert
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={toggleClientSelection}>
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Client Selection Debug Section */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              Fetched Clients ({clients.length})
              <Button
                variant="outline"
                size="sm"
                onClick={fetchClientsDirectly}
                disabled={isLoadingClients}
                className="ml-auto bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingClients ? "animate-spin" : ""}`} />
                Refresh Clients
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingClients && <div className="text-blue-600">Loading clients...</div>}

            {clientError && (
              <div className="text-red-600 mb-4">
                <strong>Error:</strong> {clientError}
              </div>
            )}

            {!isLoadingClients && clients.length === 0 && !clientError && (
              <div className="text-gray-600">No clients found</div>
            )}

            {clients.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-blue-700 mb-2">Found {clients.length} clients:</div>
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-800">
                        {client.initials}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                      <input
                        type="radio"
                        name="selectedClient"
                        value={client.id}
                        checked={selectedClientId === client.id}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Program Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Program Title</label>
                  <input
                    type="text"
                    defaultValue={programData?.program_title || "Untitled Program"}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Program Weeks</label>
                  <div className="mt-1 text-2xl font-bold text-gray-900">{programData?.routines?.length || 0}</div>
                </div>

                {programData?.routines && programData.routines.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Week Overview</label>
                    <div className="mt-2 space-y-2">
                      {programData.routines.map((routine: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Week {index + 1}</span>
                          <span className="text-sm text-gray-600">{routine.exercises?.length || 0} exercises</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Program Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Program Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {programData?.routines && programData.routines.length > 0 ? (
                  <div className="space-y-6">
                    {programData.routines.map((routine: any, routineIndex: number) => (
                      <div key={routineIndex} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">Week {routineIndex + 1}</h3>

                        {routine.exercises && routine.exercises.length > 0 ? (
                          <div className="space-y-3">
                            {routine.exercises.map((exercise: any, exerciseIndex: number) => (
                              <div
                                key={exerciseIndex}
                                className="flex justify-between items-start p-3 bg-gray-50 rounded"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {exercise.name || `Exercise ${exerciseIndex + 1}`}
                                  </div>
                                  {exercise.sets && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      {exercise.sets.map((set: any, setIndex: number) => (
                                        <span key={setIndex} className="mr-3">
                                          Set {setIndex + 1}: {set.reps || "N/A"} reps
                                          {set.weight && ` @ ${set.weight}`}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center py-4">No exercises found for this week</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg font-medium mb-2">No program data available</div>
                    <div className="text-sm">The imported program appears to be empty or could not be processed.</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Send to Client Section */}
        {showClientSelection && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Send to Client</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">Select a client to send this program to:</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedClientId === client.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                            {client.initials}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                          <input
                            type="radio"
                            name="clientSelection"
                            value={client.id}
                            checked={selectedClientId === client.id}
                            onChange={() => setSelectedClientId(client.id)}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowClientSelection(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendToClient} disabled={!selectedClientId || isSending}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? "Sending..." : "Send Program"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg font-medium mb-2">No clients available</div>
                  <div className="text-sm">You need to have active clients to send programs to them.</div>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => setShowClientSelection(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
