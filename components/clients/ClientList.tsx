"use client"
import type { Client } from "@/types/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, Target, Plus, Users } from "lucide-react"

interface ClientListProps {
  clients: Client[]
  loading: boolean
  onClientSelect: (client: Client) => void
}

export function ClientList({ clients, loading, onClientSelect }: ClientListProps) {
  console.log("[ClientList] Rendering with:", { clientsCount: clients.length, loading })

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
        <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
        <Button className="bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} onSelect={() => onClientSelect(client)} />
      ))}
    </div>
  )
}

interface ClientCardProps {
  client: Client
  onSelect: () => void
}

function ClientCard({ client, onSelect }: ClientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-yellow-500"
    if (progress >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src="/lemon-avatar.png" alt={client.name} />
              <AvatarFallback className="bg-yellow-100 text-yellow-800 font-semibold">{client.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{client.name}</h3>
              <Badge className={`text-xs ${getStatusColor(client.status)}`}>{client.status}</Badge>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {client.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.goal && (
            <div className="flex items-center text-sm text-gray-600">
              <Target className="w-4 h-4 mr-2" />
              <span className="truncate">{client.goal}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{client.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(client.progress || 0)}`}
              style={{ width: `${client.progress || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Sessions */}
        <div className="flex justify-between text-sm text-gray-600 mt-4">
          <span>
            Sessions: {client.sessions?.completed || 0}/{client.sessions?.total || 0}
          </span>
          <span>Completion: {client.completion || 0}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
