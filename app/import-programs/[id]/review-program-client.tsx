"use client"

import { ChevronLeft, Calendar, Send, ArrowLeft, Target, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Exercise {
  name: string
  sets?: number
  reps?: string
  weight?: string
  rest?: string
  notes?: string
  weeks?: Array<{
    sets?: number
    reps?: string
    weight?: string
  }>
}

interface Routine {
  name: string
  exercises: Exercise[]
}

interface Week {
  week_number: number
  routines: Routine[]
}

interface Program {
  name: string
  description?: string
  duration_weeks?: number
  is_periodized?: boolean
  weeks?: Week[]
  routines?: Routine[]
}

interface Client {
  id: string
  name: string
  email?: string
  status?: string
  initials?: string
}

interface ReviewProgramClientProps {
  programData?: any
  importId?: string
  importData: any
  initialClients?: Client[]
}

export default function ReviewProgramClient({
  programData,
  importId,
  importData,
  initialClients = [],
}: ReviewProgramClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [programState, setProgramState] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)

  // Initialize programState from importData on component mount
  useEffect(() => {
    console.log("[ReviewProgramClient] Component initializing with importData:", importData)
    console.log("[ReviewProgramClient] Initial clients provided:", initialClients.length)

    try {
      setIsLoading(true)
      setError(null)

      if (!importData) {
        setError("No import data provided")
        setIsLoading(false)
        return
      }

      if (!importData.program) {
        setError("No program data found in import")
        setIsLoading(false)
        return
      }

      const initialProgram: Program = JSON.parse(JSON.stringify(importData.program))
      initialProgram.duration_weeks =
        Number.isInteger(initialProgram.duration_weeks) && initialProgram.duration_weeks > 0
          ? initialProgram.duration_weeks
          : 4
      initialProgram.name = importData.name || initialProgram.name || "Untitled Program"

      setProgramState(initialProgram)
      setIsLoading(false)
    } catch (err) {
      console.error("Error initializing program state:", err)
      setError("Failed to load program data")
      setIsLoading(false)
    }
  }, [importData])

  // Fetch clients if not provided initially
  useEffect(() => {
    if (initialClients.length === 0) {
      fetchClientsFromAPI()
    } else {
      setClients(initialClients)
    }
  }, [initialClients])

  const fetchClientsFromAPI = async () => {
    setClientsLoading(true)
    setClientsError(null)

    try {
      const response = await fetch("/api/clients", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        console.log("[ReviewProgramClient] Fetched clients from API:", data.clients?.length || 0)
      } else {
        throw new Error("Failed to fetch clients")
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      setClientsError(error instanceof Error ? error.message : "Failed to fetch clients")
    } finally {
      setClientsLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading program...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Calendar className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Program</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Programs
          </Button>
        </div>
      </div>
    )
  }

  // No program state
  if (!programState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Calendar className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Program Data</h3>
          <p className="text-gray-500 mb-4">Unable to load program information.</p>
          <Button onClick={() => router.push("/import-programs")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Programs
          </Button>
        </div>
      </div>
    )
  }

  // Handle sending program to client
  const handleSendToClient = async () => {
    if (!selectedClientId) {
      toast({
        title: "No Client Selected",
        description: "Please select a client to send the program to.",
        variant: "destructive",
      })
      return
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId)
    if (!selectedClient) {
      toast({
        title: "Client Not Found",
        description: "The selected client could not be found.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      console.log("[ReviewProgramClient] Sending program to client:", {
        clientId: selectedClientId,
        clientName: selectedClient.name,
        programTitle: programData?.name || programState?.name,
        importId,
      })

      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          programData: programData || programState,
          customMessage,
          importId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send program")
      }

      const result = await response.json()
      console.log("[ReviewProgramClient] Program sent successfully:", result)

      toast({
        title: "Program Sent Successfully!",
        description: `The program "${programData?.name || programState?.name}" has been sent to ${selectedClient.name}.`,
      })

      // Reset form
      setSelectedClientId("")
      setCustomMessage("")
    } catch (error) {
      console.error("[ReviewProgramClient] Error sending program:", error)
      toast({
        title: "Failed to Send Program",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getRoutineCount = () => {
    return (
      programData?.routines?.length || programState?.weeks?.[0]?.routines?.length || programState?.routines?.length || 0
    )
  }

  const getTotalExercises = () => {
    const routines = programData?.routines || programState?.weeks?.[0]?.routines || programState?.routines || []
    return routines.reduce((total: number, routine: any) => {
      return total + (routine.exercises?.length || 0)
    }, 0)
  }

  const getProgramWeeks = () => {
    return programData?.duration_weeks || programState?.duration_weeks || 0
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/import-programs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Import
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Review the imported workout program and send it to a client</h1>
        </div>
      </div>

      {/* Program Overview Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Program Overview
          </CardTitle>
          <CardDescription>Summary of the imported workout program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-xl mb-2">
              {programData?.name || programState?.name || "Untitled Program"}
            </h3>
            {(programData?.description || programState?.description) && (
              <p className="text-gray-600">{programData?.description || programState?.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{getProgramWeeks()} Weeks</p>
                <p className="text-sm text-gray-500">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{getRoutineCount()} Routines</p>
                <p className="text-sm text-gray-500">Workouts</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-600">
              <span className="font-medium">{getTotalExercises()} exercises</span> across all routines
            </p>
          </div>

          {(programData?.routines || programState?.weeks?.[0]?.routines || programState?.routines) && (
            <div className="space-y-2">
              <h4 className="font-medium">Routines:</h4>
              <div className="flex flex-wrap gap-2">
                {(programData?.routines || programState?.weeks?.[0]?.routines || programState?.routines || []).map(
                  (routine: any, index: number) => (
                    <Badge key={index} variant="secondary">
                      {routine.name}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send to Client Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Send to Client
          </CardTitle>
          <CardDescription>Choose a client and send this program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client-select">Select Client</Label>
            {clientsLoading ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">Loading clients...</span>
              </div>
            ) : clientsError ? (
              <div className="p-3 border border-red-200 rounded-md bg-red-50">
                <p className="text-sm text-red-600">Error loading clients: {clientsError}</p>
                <Button variant="outline" size="sm" onClick={fetchClientsFromAPI} className="mt-2 bg-transparent">
                  Retry
                </Button>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-sm text-gray-600">No clients found. Add clients first to send programs.</p>
                <Link href="/clients">
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                    Go to Clients
                  </Button>
                </Link>
              </div>
            ) : (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <span>{client.initials || client.name?.charAt(0) || "?"}</span>
                        <span>{client.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {client.status || "Active"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Add a personal message for your client..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendToClient}
            disabled={!selectedClientId || isSending || clientsLoading}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            {isSending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Sending Program...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Program to Client
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
