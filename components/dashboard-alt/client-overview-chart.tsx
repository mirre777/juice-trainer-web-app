"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ClientOverviewChartProps {
  timeRange: "week" | "month" | "quarter" | "year"
}

export function ClientOverviewChart({ timeRange }: ClientOverviewChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // In a real app, this would fetch data from an API
    // Here we're generating sample data based on the timeRange

    let chartData = []

    if (timeRange === "week") {
      chartData = [
        { name: "Mon", activeClients: 28, sessionAttendance: 22 },
        { name: "Tue", activeClients: 32, sessionAttendance: 27 },
        { name: "Wed", activeClients: 30, sessionAttendance: 24 },
        { name: "Thu", activeClients: 34, sessionAttendance: 30 },
        { name: "Fri", activeClients: 32, sessionAttendance: 28 },
        { name: "Sat", activeClients: 26, sessionAttendance: 20 },
        { name: "Sun", activeClients: 22, sessionAttendance: 18 },
      ]
    } else if (timeRange === "month") {
      chartData = [
        { name: "Week 1", activeClients: 30, sessionAttendance: 25 },
        { name: "Week 2", activeClients: 34, sessionAttendance: 28 },
        { name: "Week 3", activeClients: 38, sessionAttendance: 32 },
        { name: "Week 4", activeClients: 42, sessionAttendance: 36 },
      ]
    } else if (timeRange === "quarter") {
      chartData = [
        { name: "Jan", activeClients: 32, sessionAttendance: 26 },
        { name: "Feb", activeClients: 36, sessionAttendance: 30 },
        { name: "Mar", activeClients: 42, sessionAttendance: 36 },
      ]
    } else {
      chartData = [
        { name: "Q1", activeClients: 35, sessionAttendance: 30 },
        { name: "Q2", activeClients: 40, sessionAttendance: 34 },
        { name: "Q3", activeClients: 38, sessionAttendance: 32 },
        { name: "Q4", activeClients: 42, sessionAttendance: 36 },
      ]
    }

    setData(chartData)
  }, [timeRange])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="activeClients" stroke="#8884d8" activeDot={{ r: 8 }} name="Active Clients" />
        <Line type="monotone" dataKey="sessionAttendance" stroke="#82ca9d" name="Session Attendance" />
      </LineChart>
    </ResponsiveContainer>
  )
}
