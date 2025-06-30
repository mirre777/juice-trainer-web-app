"use client"

import { useState } from "react"
import { Search, Filter, Users, UserCheck, UserX, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface ClientsFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  clientsCount: number
}

export function ClientsFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clientsCount,
}: ClientsFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const statusOptions = [
    { value: "all", label: "All Clients", icon: Users },
    { value: "active", label: "Active", icon: UserCheck },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "inactive", label: "Inactive", icon: UserX },
  ]

  const currentStatus = statusOptions.find((option) => option.value === statusFilter)

  console.log("[ClientsFilterBar] Rendering with:", {
    searchTerm,
    statusFilter,
    clientsCount,
    currentStatus: currentStatus?.label,
  })

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3">
        {/* Results Count */}
        <Badge variant="secondary" className="hidden sm:flex">
          {clientsCount} {clientsCount === 1 ? "client" : "clients"}
        </Badge>

        {/* Status Filter */}
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              {currentStatus?.label || "All Clients"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {statusOptions.map((option) => {
              const Icon = option.icon
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    console.log("[ClientsFilterBar] Status filter changed to:", option.value)
                    onStatusFilterChange(option.value)
                    setIsFilterOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                  {statusFilter === option.value && (
                    <Badge variant="secondary" className="ml-auto">
                      ✓
                    </Badge>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log("[ClientsFilterBar] Clearing all filters")
              onSearchChange("")
              onStatusFilterChange("all")
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
