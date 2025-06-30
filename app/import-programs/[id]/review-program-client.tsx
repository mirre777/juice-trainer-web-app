"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User } from "@/components/icons/user"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  name: string
  email?: string
}

interface ReviewProgramClientProps {
  programData: any
  programId: string
}

export default function ReviewProgramClient({ programData, programId }: ReviewProgramClientProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToClient = async () => {
    if (!selectedClient) return

    setIsSending(true)
    try {
      const response = await fetch("/api/programs/send-to-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programData,
          clientId: selectedClient.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Program sent to ${selectedClient.name} successfully!`,
        })
        setShowClientDialog(false)
        setSelectedClient(null)
      } else {
        throw new Error(result.error || "Failed to send program")
      }
    } catch (error) {
      console.error("Error sending program:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send program to client",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const renderProgramOverview = () => {
    const totalWeeks = programData.weeks?.length || 1
    const totalRoutines =
      programData.weeks?.reduce((acc: number, week: any) => acc + (week.routines?.length || 0), 0) ||
      programData.routines?.length ||
      0

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {programData.title || programData.name || "Imported Program"}
            <Badge variant="secondary">{totalWeeks} weeks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Weeks</p>
              <p className="text-lg font-semibold">{totalWeeks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Routines</p>
              <p className="text-lg font-semibold">{totalRoutines}</p>
            </div>
          </div>
          {programData.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="text-sm">{programData.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderWeeks = () => {
    if (!programData.weeks) return null

    return programData.weeks.map((week: any, weekIndex: number) => (
      <Card key={weekIndex} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Week {week.week_number || weekIndex + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {week.routines?.map((routine: any, routineIndex: number) => (
              <div key={routineIndex} className="border rounded-lg p-3">
                <h4 className="font-medium mb-2">{routine.name}</h4>
                <div className="text-sm text-gray-600">{routine.exercises?.length || 0} exercises</div>
                {routine.notes && <p className="text-sm text-gray-500 mt-1">{routine.notes}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Program</h1>
        <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
          <DialogTrigger asChild>
            <Button>Send to Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {isLoading ? (
                <p>Loading clients...</p>
              ) : clients.length === 0 ? (
                <p>No clients found. Add clients first.</p>
              ) : (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClient?.id === client.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5" />
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowClientDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendToClient} disabled={!selectedClient || isSending}>
                  {isSending ? "Sending..." : "Send Program"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {renderProgramOverview()}
      {renderWeeks()}
    </div>
  )
}
