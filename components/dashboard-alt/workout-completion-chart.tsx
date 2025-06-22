"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface WorkoutCompletionChartProps {
  timeRange: "week" | "month" | "quarter" | "year"
}

export function WorkoutCompletionChart({ timeRange }: WorkoutCompletionChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Sample data - would be fetched from API in a real app
    const chartData = [
      { name: "Strength", value: 35 },
      { name: "Cardio", value: 25 },
      { name: "HIIT", value: 20 },
      { name: "Flexibility", value: 15 },
      { name: "Recovery", value: 5 },
    ]

    setData(chartData)
  }, [timeRange])

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
