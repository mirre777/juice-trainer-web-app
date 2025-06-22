"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { ExerciseHistoryEntry } from "@/types/exercise-history"

interface ExerciseHistoryChartProps {
  entries: ExerciseHistoryEntry[]
  title?: string
  timeRange?: "1m" | "3m" | "6m" | "1y" | "all"
}

export function ExerciseHistoryChart({
  entries,
  title = "Progress Over Time",
  timeRange = "6m",
}: ExerciseHistoryChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [hoverPoint, setHoverPoint] = useState<ExerciseHistoryEntry | null>(null)
  const [visibleEntries, setVisibleEntries] = useState<ExerciseHistoryEntry[]>([])
  const [currentRange, setCurrentRange] = useState<"1m" | "3m" | "6m" | "1y" | "all">(timeRange)

  // Filter entries based on time range
  useEffect(() => {
    const now = new Date()
    let cutoffDate = new Date()

    switch (currentRange) {
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case "all":
      default:
        cutoffDate = new Date(0) // Beginning of time
    }

    const filtered = entries.filter((entry) => new Date(entry.date) >= cutoffDate)
    setVisibleEntries(filtered)
  }, [entries, currentRange])

  // Calculate chart dimensions and data points
  const getChartPoints = () => {
    if (!visibleEntries.length) return []

    // Extract weights as numbers
    const weights = visibleEntries.map((entry) => Number.parseInt(entry.weight.split(" ")[0]))

    // Find min and max for scaling
    const minWeight = Math.min(...weights) * 0.9 // Add 10% padding
    const maxWeight = Math.max(...weights) * 1.1

    // Calculate points
    return visibleEntries.map((entry, index) => {
      const weight = Number.parseInt(entry.weight.split(" ")[0])
      // X position is based on index, Y position is scaled between 0-1 based on weight
      const x = index / (visibleEntries.length - 1)
      const y = 1 - (weight - minWeight) / (maxWeight - minWeight)

      return {
        entry,
        x,
        y,
        weight,
      }
    })
  }

  const chartPoints = getChartPoints()

  // Generate SVG path for the line
  const generatePath = () => {
    if (chartPoints.length < 2) return ""

    const width = 100
    const height = 100

    return chartPoints
      .map((point, i) => {
        const x = point.x * width
        const y = point.y * height
        return `${i === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }

  // Handle mouse movement for hover effects
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current || chartPoints.length === 0) return

    const rect = chartRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width

    // Find closest point
    let closestPoint = chartPoints[0]
    let minDistance = Math.abs(x - closestPoint.x)

    chartPoints.forEach((point) => {
      const distance = Math.abs(x - point.x)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    })

    setHoverPoint(closestPoint.entry)
  }

  const handleMouseLeave = () => {
    setHoverPoint(null)
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        <div className="flex gap-2">
          {/* Time range selector */}
          <div className="flex bg-gray-100 rounded-lg overflow-hidden">
            {(["1m", "3m", "6m", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                className={`px-2 py-1 text-xs ${currentRange === range ? "bg-primary text-black" : "text-darkgray"}`}
                onClick={() => setCurrentRange(range)}
              >
                {range === "all" ? "All" : range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={chartRef} className="relative h-[300px] w-full">
        {/* Chart */}
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under the line */}
          <path d={`${generatePath()} L ${chartPoints.length ? 100 : 0} 100 L 0 100 Z`} fill="url(#chartGradient)" />

          {/* Line */}
          <path d={generatePath()} fill="none" stroke="var(--primary)" strokeWidth="2" />

          {/* Data points */}
          {chartPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x * 100}
              cy={point.y * 100}
              r="2"
              fill={hoverPoint?.id === point.entry.id ? "#000" : "#D2FF28"}
              stroke={hoverPoint?.id === point.entry.id ? "#D2FF28" : "none"}
              strokeWidth="1"
              // Ensure perfect circles by setting shapeRendering
              shapeRendering="geometricPrecision"
            />
          ))}

          {/* Hover point */}
          {hoverPoint && chartPoints.find((p) => p.entry.id === hoverPoint.id) && (
            <g>
              <circle
                cx={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}
                cy={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.y * 100}
                r="4"
                fill="#D2FF28"
                shapeRendering="geometricPrecision"
              />
              <line
                x1={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}
                y1={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.y * 100}
                x2={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}
                y2="100"
                stroke="#D2FF28"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          )}
        </svg>

        {/* Hover tooltip */}
        {hoverPoint && (
          <div
            className="absolute bg-black text-white text-xs px-3 py-1 rounded pointer-events-none"
            style={{
              left: `${chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}%`,
              top: `${chartPoints.find((p) => p.entry.id === hoverPoint.id)!.y * 100}%`,
              transform: "translate(-50%, -150%)",
            }}
          >
            {hoverPoint.formattedDate}: {hoverPoint.weight} × {hoverPoint.reps}
          </div>
        )}

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
          {chartPoints.length > 0 && (
            <>
              <div>{Math.max(...chartPoints.map((p) => p.weight))} kg</div>
              <div>{Math.min(...chartPoints.map((p) => p.weight))} kg</div>
            </>
          )}
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 px-2">
          {visibleEntries.length > 0 && (
            <>
              <div>{visibleEntries[0].formattedDate}</div>
              <div>{visibleEntries[visibleEntries.length - 1].formattedDate}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
