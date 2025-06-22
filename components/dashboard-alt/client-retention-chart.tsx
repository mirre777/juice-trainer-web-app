"use client"

import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ClientRetentionChartProps {
  timeRange: "week" | "month" | "quarter" | "year"
}

export function ClientRetentionChart({ timeRange }: ClientRetentionChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Sample data based on timeRange
    let chartData = []

    if (timeRange === "month") {
      chartData = [
        { name: "Jan", retention: 94 },
        { name: "Feb", retention: 92 },
        { name: "Mar", retention: 95 },
        { name: "Apr", retention: 93 },
        { name: "May", retention: 96 },
        { name: "Jun", retention: 94 },
        { name: "Jul", retention: 92 },
        { name: "Aug", retention: 90 },
        { name: "Sep", retention: 92 },
        { name: "Oct", retention: 93 },
        { name: "Nov", retention: 94 },
        { name: "Dec", retention: 92 },
      ]
    } else if (timeRange === "quarter") {
      chartData = [
        { name: "Q1 2022", retention: 91 },
        { name: "Q2 2022", retention: 93 },
        { name: "Q3 2022", retention: 92 },
        { name: "Q4 2022", retention: 90 },
        { name: "Q1 2023", retention: 94 },
        { name: "Q2 2023", retention: 92 },
      ]
    } else if (timeRange === "year") {
      chartData = [
        { name: "2018", retention: 88 },
        { name: "2019", retention: 90 },
        { name: "2020", retention: 86 },
        { name: "2021", retention: 91 },
        { name: "2022", retention: 92 },
        { name: "2023", retention: 92 },
      ]
    } else {
      // Week view
      chartData = [
        { name: "Week 1", retention: 94 },
        { name: "Week 2", retention: 93 },
        { name: "Week 3", retention: 95 },
        { name: "Week 4", retention: 92 },
      ]
    }

    setData(chartData)
  }, [timeRange])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[80, 100]} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Area
          type="monotone"
          dataKey="retention"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.3}
          name="Client Retention"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
