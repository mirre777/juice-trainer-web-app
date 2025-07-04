"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

interface ClientsFilterBarProps {
  onSearch: (searchTerm: string) => void
  onStatusChange: (status: string) => void
  totalCount: number
}

const ClientsFilterBar: React.FC<ClientsFilterBarProps> = ({ onSearch, onStatusChange, totalCount }) => {
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, onSearch])

  return (
    <div className="flex items-center space-x-4">
      <Input
        type="text"
        placeholder="Search clients..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Statuses ({totalCount})</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Invited">Invited</SelectItem>
          <SelectItem value="Paused">Paused</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default ClientsFilterBar
