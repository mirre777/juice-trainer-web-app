"use client"
import { Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface ClientsFilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  expandFilter: string
  onExpandFilterChange: (filter: string) => void
  collapseFilter: string
  onCollapseFilterChange: (filter: string) => void
  clientCount: number
  totalCount: number
}

export function ClientsFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  expandFilter,
  onExpandFilterChange,
  collapseFilter,
  onCollapseFilterChange,
  clientCount,
  totalCount,
}: ClientsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search clients by name, email, goal, or program..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Invited">Invited</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        {/* Expand/Collapse Controls */}
        <Button variant="outline" size="sm" onClick={() => onExpandFilterChange("All")} className="whitespace-nowrap">
          Expand All
        </Button>

        <Button variant="outline" size="sm" onClick={() => onCollapseFilterChange("All")} className="whitespace-nowrap">
          Collapse All
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 whitespace-nowrap">
        Showing {clientCount} of {totalCount} clients
      </div>
    </div>
  )
}
