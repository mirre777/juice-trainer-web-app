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
      <h1>Overview</h1>
      <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
