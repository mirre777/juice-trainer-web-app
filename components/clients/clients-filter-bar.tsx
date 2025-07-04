"use client"

import { useState } from "react"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const statusOptions = ["All", "Active", "Inactive", "Pending", "Invited", "Paused", "On Hold", "Deleted"]

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search clients by name, email, goal, program..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="flex items-center gap-2 min-w-[140px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Status: {statusFilter}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showStatusDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            {statusOptions.map((status) => (
              <button
                key={status}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  onStatusFilterChange(status)
                  setShowStatusDropdown(false)
                }}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onExpandFilterChange("All")}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={() => onCollapseFilterChange("All")}>
          Collapse All
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 flex items-center whitespace-nowrap">
        Showing {clientCount} of {totalCount}
      </div>
    </div>
  )
}
