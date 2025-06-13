"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter } from "lucide-react"

interface ClientsFilterBarProps {
  onSearch: (query: string) => void
  onStatusChange: (status: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  statusFilter: string
  children?: React.ReactNode
}

export function ClientsFilterBar({
  onSearch,
  onStatusChange,
  onExpandAll,
  onCollapseAll,
  statusFilter = "All",
  children,
}: ClientsFilterBarProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const handleStatusChange = (status: string) => {
    onStatusChange(status)
    setShowStatusDropdown(false)
  }

  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div className="relative w-full md:w-auto md:min-w-[320px]">
        <input
          type="text"
          placeholder="Search clients..."
          className="w-full h-10 pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200"
          onChange={(e) => onSearch(e.target.value)}
        />
        <svg
          className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            className="h-10 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Status: {statusFilter}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {showStatusDropdown && (
            <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="py-1">
                {["All", "Active", "Pending", "On Hold", "Inactive", "Deleted"].map((status) => (
                  <button
                    key={status}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => handleStatusChange(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onExpandAll}
          className="h-10 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2"
        >
          <ChevronUp className="h-4 w-4 text-gray-500 transform rotate-180" />
          <span className="text-sm">Expand All</span>
        </button>

        <button
          onClick={onCollapseAll}
          className="h-10 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2"
        >
          <ChevronDown className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Collapse All</span>
        </button>

        {children}
      </div>
    </div>
  )
}
