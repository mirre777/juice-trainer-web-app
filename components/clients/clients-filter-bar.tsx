"use client"

import { useState } from "react"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface ClientsFilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  clientCounts: {
    total: number
    active: number
    inactive: number
    pending: number
    invited: number
    paused: number
  }
}

export function ClientsFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clientCounts,
}: ClientsFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions = [
    { value: "all", label: "All Clients", count: clientCounts.total },
    { value: "Active", label: "Active", count: clientCounts.active },
    { value: "Inactive", label: "Inactive", count: clientCounts.inactive },
    { value: "Pending", label: "Pending", count: clientCounts.pending },
    { value: "Invited", label: "Invited", count: clientCounts.invited },
    { value: "Paused", label: "Paused", count: clientCounts.paused },
  ]

  const currentStatusOption = statusOptions.find((option) => option.value === statusFilter) || statusOptions[0]

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search clients by name, email, goal, or program..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Status: {currentStatusOption.label}
                <Badge variant="secondary" className="ml-1">
                  {currentStatusOption.count}
                </Badge>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusFilterChange(option.value)}
                  className="flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  <Badge variant={option.value === statusFilter ? "default" : "secondary"}>{option.count}</Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchChange("")
                onStatusFilterChange("all")
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Expand/Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          {isExpanded ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      {/* Active Filters Summary */}
      {(searchTerm || statusFilter !== "all") && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1">
              Search: "{searchTerm}"
              <button onClick={() => onSearchChange("")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {currentStatusOption.label}
              <button onClick={() => onStatusFilterChange("all")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
