"use client"

interface RevenueOverviewProps {
  timeRange: "week" | "month" | "quarter" | "year"
}

export function RevenueOverview({ timeRange }: RevenueOverviewProps) {
  return (
    <div className="space-y-2 p-4 bg-white rounded-lg border">
      <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
      <p className="text-3xl font-bold">120</p>
    </div>
  )
}
