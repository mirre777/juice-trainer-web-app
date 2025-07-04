"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface ClientsFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  clients: any[]
}

export function ClientsFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clients,
}: ClientsFilterBarProps) {
  // Get unique statuses from clients
  const statuses = Array.from(new Set(clients.map((client) => client.status || "Unknown")))
  const statusCounts = statuses.reduce(
    (acc, status) => {
      acc[status] = clients.filter((client) => (client.status || "Unknown") === status).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search clients by name, email, goal, program..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients ({clients.length})</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status} ({statusCounts[status]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
