"use client"

import { useState } from "react"

interface RevenueChartProps {
  data: {
    month: string
    amount: number
  }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  // Find the maximum value for scaling
  const maxAmount = Math.max(...data.map((item) => item.amount))

  // Generate colors for the bars
  const colors = [
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#10B981", // Green
  ]

  return (
    <div className="h-80">
      <div className="flex items-end justify-between h-full px-4">
        {data.map((item, index) => {
          const height = `${(item.amount / maxAmount) * 100}%`
          const isHovered = hoveredBar === index

          return (
            <div
              key={item.month}
              className="flex flex-col items-center group"
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className="relative w-16 rounded-t-md transition-all duration-300 cursor-pointer"
                style={{
                  height,
                  backgroundColor: colors[index % colors.length],
                  transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                }}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                    ${item.amount.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm font-medium">{item.month}</div>
              <div className={`text-gray-500 text-sm transition-opacity ${isHovered ? "opacity-100" : "opacity-70"}`}>
                ${item.amount}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
