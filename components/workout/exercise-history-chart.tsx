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

  // Helper to format date as dd.mm.yyyy
  function formatDateDMY(date: string) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Filter entries based on time range and sort by date ascending
  useEffect(() => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (currentRange) {
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
      default:
        cutoffDate = new Date(0); // Beginning of time
    }

    const filtered = entries
      .filter((entry) => new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setVisibleEntries(filtered);
  }, [entries, currentRange]);

  // Calculate chart dimensions and data points
  const getChartPoints = () => {
    if (!visibleEntries.length) return [];

    // Extract weights as numbers
    const weights = visibleEntries.map((entry) => Number.parseInt(entry.weight.split(" ")[0]));

    // Find min and max for scaling
    const minWeight = Math.min(...weights) * 0.9; // Add 10% padding
    const maxWeight = Math.max(...weights) * 1.1;

    // Handle single data point: center it
    if (visibleEntries.length === 1) {
      const entry = visibleEntries[0];
      const weight = Number.parseInt(entry.weight.split(" ")[0]);
      return [{ entry, x: 0.5, y: 0.5, weight }];
    }

    // Calculate points
    return visibleEntries.map((entry, index) => {
      const weight = Number.parseInt(entry.weight.split(" ")[0]);
      // X position is based on index, Y position is scaled between 0-1 based on weight
      const x = index / (visibleEntries.length - 1);
      const y = 1 - (weight - minWeight) / (maxWeight - minWeight);

      return {
        entry,
        x,
        y,
        weight,
      };
    });
  };

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
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
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
          {/* Blue background gradient */}
          <defs>
            <linearGradient id="chartBlueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under the line and line only if enough points */}
          {chartPoints.length >= 2 && (
            <>
              <path d={`${generatePath()} L 100 100 L 0 100 Z`} fill="url(#chartBlueGradient)" />
              <path d={generatePath()} fill="none" stroke="#2563eb" strokeWidth="0.8" />
            </>
          )}

          {/* Data points */}
          {chartPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x * 100}
              cy={point.y * 100}
              r="1.0"
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth={hoverPoint?.id === point.entry.id ? 2 : 0}
              shapeRendering="geometricPrecision"
            />
          ))}

          {/* X-axis date labels */}
          {chartPoints.map((point, i) => (
            <text
              key={"label-" + i}
              x={point.x * 100}
              y={102}
              textAnchor="middle"
              fontSize="3"
              fill="#888"
              style={{ pointerEvents: "none" }}
            >
              {formatDateDMY(point.entry.date)}
            </text>
          ))}

          {/* Hover point */}
          {hoverPoint && chartPoints.find((p) => p.entry.id === hoverPoint.id) && (
            <g>
              <circle
                cx={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}
                cy={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.y * 100}
                r="1.6"
                fill="#fff"
                stroke="#2563eb"
                strokeWidth="2"
                shapeRendering="geometricPrecision"
              />
              <line
                x1={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}
                y1={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.y * 100}
                x2={chartPoints.find((p) => p.entry.id === hoverPoint.id)!.x * 100}
                y2="100"
                stroke="#2563eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          )}

          {/* Placeholder for no data */}
          {chartPoints.length === 0 && (
            <text
              x="50"
              y="50"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize="7"
              fill="#bbb"
            >
              No data yet
            </text>
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

        {/* Info field below x-axis */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          1RM is estimated using Epley's formula: <span className="font-mono">weight × (1 + reps / 30)</span>
        </div>
      </div>
    </div>
  )
}
