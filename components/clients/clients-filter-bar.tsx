"use client"

import { Search, ChevronDown, Users } from "lucide-react"
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
  const statusOptions = ["All", "Active", "Inactive", "Pending", "On Hold", "Invited", "Accepted Invitation"]

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients by name, email, goal, program..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                Status: {status}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExpandFilterChange(expandFilter === "All" ? "None" : "All")}
          >
            {expandFilter === "All" ? "Collapse All" : "Expand All"}
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          <Users className="h-4 w-4" />
          <span>
            Showing {clientCount} of {totalCount}
          </span>
        </div>
      </div>
    </div>
  )
}
