"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { subscribeToClients } from "@/lib/firebase/client-service-fixed"
import type { Client } from "@/types/client"
import { getCookie } from "cookies-next"

export default function ClientPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch clients when component mounts or user changes
  useEffect(() => {
    console.log("[ClientPage] Effect triggered, user:", user)

    if (!user) {
      console.log("[ClientPage] No user, setting loading to false")
      setLoading(false)
      return
    }

    // Try to get user ID from cookie as fallback
    const userId = user.uid || getCookie("user_id")?.toString()

    if (!userId) {
      console.log("[ClientPage] No user ID available")
      setError("User not authenticated")
      setLoading(false)
      return
    }

    console.log("[ClientPage] Setting up client subscription for user:", userId)
    setLoading(true)
    setError(null)

    // Subscribe to real-time client updates using the fixed service
    const unsubscribe = subscribeToClients(userId, (clientsData, subscriptionError) => {
      console.log("[ClientPage] Received clients data:", clientsData)

      if (subscriptionError) {
        console.error("[ClientPage] Subscription error:", subscriptionError)
        setError("Failed to load clients")
        setClients([])
      } else {
        console.log("[ClientPage] Setting clients:", clientsData.length, "clients")
        setClients(clientsData || [])
        setError(null)
      }

      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log("[ClientPage] Cleaning up subscription")
      unsubscribe()
    }
  }, [user])

  // Filter clients based on search term and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button className="bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading clients...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Clients</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" className="mt-2 bg-transparent" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button className="bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No clients found</p>
          <Button className="bg-green-500 hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Client
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-gray-600">{client.email}</p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : client.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="font-semibold">{client.progress}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
