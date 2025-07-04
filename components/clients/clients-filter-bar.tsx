"use client"

import { useState } from "react"
import { Search, Filter, ExpandIcon, ShrinkIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ClientsFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  clientCounts: {
    total: number
    active: number
    pending: number
    inactive: number
    invited: number
    paused: number
  }
  filteredCount: number
}

export function ClientsFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExpandAll,
  onCollapseAll,
  clientCounts,
  filteredCount,
}: ClientsFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions = [
    { value: "All", label: "All", count: clientCounts.total },
    { value: "Active", label: "Active", count: clientCounts.active },
    { value: "Pending", label: "Pending", count: clientCounts.pending },
    { value: "Inactive", label: "Inactive", count: clientCounts.inactive },
    { value: "Invited", label: "Invited", count: clientCounts.invited },
    { value: "Paused", label: "Paused", count: clientCounts.paused },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search clients by name, email, goal, program..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Status: {statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onStatusFilterChange(option.value)}
                className="flex justify-between items-center"
              >
                <span>{option.label}</span>
                <span className="text-sm text-gray-500 ml-2">({option.count})</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand/Collapse Controls */}
        <Button variant="outline" onClick={onExpandAll} className="gap-2 bg-transparent">
          <ExpandIcon className="h-4 w-4" />
          Expand All
        </Button>
        <Button variant="outline" onClick={onCollapseAll} className="gap-2 bg-transparent">
          <ShrinkIcon className="h-4 w-4" />
          Collapse All
        </Button>

        {/* Results Count */}
        <div className="text-sm text-gray-600 whitespace-nowrap">
          Showing {filteredCount} of {clientCounts.total}
        </div>
      </div>
    </div>
  )
}
