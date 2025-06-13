"use client"

import type React from "react"

import { Progress } from "@/components/ui/progress"
import { Target, TrendingUp, Users, Clock } from "lucide-react"

interface PerformanceMetricsProps {
  timeRange: "week" | "month" | "quarter" | "year"
}

interface Metric {
  name: string
  value: number
  target: number
  icon: React.ReactNode
  unit: string
}

export function PerformanceMetrics({ timeRange }: PerformanceMetricsProps) {
  // Sample data - would come from API in a real app
  const metrics: Metric[] = [
    {
      name: "Client Acquisition",
      value: 8,
      target: 10,
      icon: <Users className="h-4 w-4 text-info" />,
      unit: "clients",
    },
    {
      name: "Revenue Growth",
      value: 12,
      target: 15,
      icon: <TrendingUp className="h-4 w-4 text-success" />,
      unit: "%",
    },
    {
      name: "Session Efficiency",
      value: 85,
      target: 90,
      icon: <Clock className="h-4 w-4 text-warning" />,
      unit: "%",
    },
    {
      name: "Goal Completion",
      value: 75,
      target: 80,
      icon: <Target className="h-4 w-4 text-primary" />,
      unit: "%",
    },
  ]

  return (
    <div className="space-y-6">
      {metrics.map((metric) => (
        <div key={metric.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="mr-2 bg-gray-100 p-1 rounded-full">{metric.icon}</div>
              <span className="text-sm font-medium">{metric.name}</span>
            </div>
            <div className="text-sm font-medium">
              {metric.value} / {metric.target} {metric.unit}
            </div>
          </div>

          <Progress value={(metric.value / metric.target) * 100} className="h-2" />
        </div>
      ))}
    </div>
  )
}
