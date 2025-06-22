"use client"

import { useState } from "react"
import type { ExerciseHistoryEntry } from "@/types/exercise-history"
import { Trophy, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"

interface ExerciseHistoryTableProps {
  entries: ExerciseHistoryEntry[]
}

type SortField = "date" | "weight" | "reps" | "volume" | "rpe"
type SortDirection = "asc" | "desc"

export function ExerciseHistoryTable({ entries }: ExerciseHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [page, setPage] = useState(1)
  const entriesPerPage = 10

  // Handle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Sort entries
  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case "weight":
        comparison = Number.parseInt(a.weight) - Number.parseInt(b.weight)
        break
      case "reps":
        const aReps = typeof a.reps === "number" ? a.reps : Number.parseInt(a.reps as string)
        const bReps = typeof b.reps === "number" ? b.reps : Number.parseInt(b.reps as string)
        comparison = aReps - bReps
        break
      case "volume":
        comparison = a.totalVolume - b.totalVolume
        break
      case "rpe":
        comparison = (a.rpe || 0) - (b.rpe || 0)
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  // Paginate entries
  const paginatedEntries = sortedEntries.slice((page - 1) * entriesPerPage, page * entriesPerPage)

  const totalPages = Math.ceil(entries.length / entriesPerPage)

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ArrowUpDown className="w-4 h-4 ml-1" />
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date <SortIcon field="date" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("weight")}
              >
                <div className="flex items-center">
                  Weight <SortIcon field="weight" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("reps")}
              >
                <div className="flex items-center">
                  Reps <SortIcon field="reps" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Sets</th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("volume")}
              >
                <div className="flex items-center">
                  Volume <SortIcon field="volume" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("rpe")}
              >
                <div className="flex items-center">
                  RPE <SortIcon field="rpe" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.map((entry) => (
              <tr key={entry.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-medium flex items-center">
                  {entry.weight}
                  {entry.isPR && <Trophy className="w-4 h-4 text-amber-500 ml-2" />}
                </td>
                <td className="px-4 py-3">{entry.reps}</td>
                <td className="px-4 py-3">{entry.sets}</td>
                <td className="px-4 py-3">{entry.totalVolume}</td>
                <td className="px-4 py-3">{entry.rpe || "-"}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{entry.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * entriesPerPage + 1} to {Math.min(page * entriesPerPage, entries.length)} of{" "}
            {entries.length} entries
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-white border text-sm disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded bg-white border text-sm disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
