"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, DollarSign, BarChart, ChevronDown, Dumbbell } from "lucide-react"

interface QuickStatsProps {
  stats: {
    activeClients: number
    activeClientsChange: number
    revenuePM: number
    revenuePMChange: number
    clientRetention: number
    clientRetentionChange: number
    trainingSessions: number
    trainingSessionsChange: number
    completionRate: number
    completionRateChange: number
  }
}

export function QuickStats({ stats }: QuickStatsProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-8 w-full md:w-1/2">
      <Card className="border rounded-lg shadow-sm h-full">
        <CardContent className="p-4 h-full">
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center text-gray-500 hover:text-gray-700 border rounded-md px-2 py-1 text-xs"
            >
              <span>{expanded ? "Show Less" : "Show More"}</span>
              <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <Users className="w-4 h-4" />,
                label: "Active Clients",
                value: stats.activeClients,
                change: `+${stats.activeClientsChange}%`,
              },
              {
                icon: <DollarSign className="w-4 h-4" />,
                label: "Revenue",
                value: `$${stats.revenuePM.toLocaleString()}`,
                change: `+${stats.revenuePMChange}%`,
              },
              {
                icon: <BarChart className="w-4 h-4" />,
                label: "Completion",
                value: `${stats.completionRate}%`,
                change: `+${stats.completionRateChange}%`,
              },
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-between bg-white rounded-lg p-2">
                <div className="bg-black text-white p-1.5 rounded-full mb-1 w-8 h-8 flex items-center justify-center">
                  {stat.icon}
                </div>
                <span className="text-xs font-medium text-center">{stat.label}</span>
                <p className="text-lg font-bold my-1 text-center">{stat.value}</p>
                <p className="text-green-500 text-xs text-center">{stat.change}</p>
              </div>
            ))}
          </div>

          {expanded && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
              {[
                {
                  icon: <Dumbbell className="w-4 h-4" />,
                  label: "Workouts",
                  value: "156",
                  change: "+8%",
                },
                {
                  icon: <Users className="w-4 h-4" />,
                  label: "New Clients",
                  value: "8",
                  change: "This month",
                },
                {
                  icon: <BarChart className="w-4 h-4" />,
                  label: "Engagement",
                  value: "78%",
                  change: "+5%",
                },
              ].map((stat, index) => (
                <div key={index} className="flex flex-col items-center justify-between bg-white rounded-lg p-2">
                  <div className="bg-black text-white p-1.5 rounded-full mb-1 w-8 h-8 flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <span className="text-xs font-medium text-center">{stat.label}</span>
                  <p className="text-lg font-bold my-1 text-center">{stat.value}</p>
                  <p
                    className={`${stat.change.includes("+") ? "text-green-500" : "text-gray-500"} text-xs text-center`}
                  >
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
