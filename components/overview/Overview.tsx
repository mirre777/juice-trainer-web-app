"use client"

// Placeholder for components/overview/Overview.tsx
import type React from "react"

interface OverviewProps {
  data: any
  search: string
  setSearch: (search: string) => void
}

export const Overview: React.FC<OverviewProps> = ({ data, search, setSearch }) => {
  return (
    <div>
      <h2>Overview Placeholder</h2>
      <p>Data: {JSON.stringify(data)}</p>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
    </div>
  )
}
