"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Plus, Mail, Phone } from "lucide-react"
import { fetchClients } from "@/lib/firebase/client-service"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  joinDate?: string
  lastWorkout?: string
  initials?: string
  bgColor?: string
  textColor?: string
}

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchClientsData()
  }, [])

  const fetchClientsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get trainer ID from cookie
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift()
        return null
      }

      const trainerId = getCookie("user_id")

      if (!trainerId) {
        router.push("/login")
        return
      }

      console.log("Fetching clients for trainer:", trainerId)

      // Use the Firebase client service directly instead of API route
      const clientsData = await fetchClients(trainerId)

      console.log("Fetched clients:", clientsData)

      // Map the client data to match the interface
      const mappedClients = clientsData.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email || "",
        phone: client.phone || "",
        status: client.status || "Active",
        joinDate: client.createdAt ? new Date(client.createdAt.seconds * 1000).toLocaleDateString() : "",
        lastWorkout: client.lastWorkout?.name || "",
        initials: client.initials,
        bgColor: client.bgColor,
        textColor: client.textColor,
      }))

      setClients(mappedClients)
    } catch (err) {
      console.error("Error fetching clients:", err)
      setError(err instanceof Error ? err.message : "Failed to load clients")
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={fetchClientsData} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No clients match your search." : "Get started by adding your first client."}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{
                          backgroundColor: client.bgColor || "#f3f4f6",
                          color: client.textColor || "#111827",
                        }}
                      >
                        {client.initials || client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{client.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {client.email || "No email"}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                        {client.joinDate && <p className="text-xs text-gray-400 mt-1">Joined: {client.joinDate}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
