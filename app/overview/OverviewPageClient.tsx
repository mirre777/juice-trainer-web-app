"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, DollarSign, Clock, Star } from "lucide-react"
import { UnifiedHeader } from "@/components/unified-header"
import { RevenueChart } from "@/components/revenue-chart"

// Mock data - replace with real data fetching
const mockStats = {
  totalClients: 24,
  activeClients: 18,
  monthlyRevenue: 4800,
  completedSessions: 156,
  upcomingSessions: 8,
  clientRetention: 92,
}

const mockRecentActivities = [
  { id: 1, client: "Sarah Johnson", action: "Completed workout", time: "2 hours ago" },
  { id: 2, client: "Mike Chen", action: "Scheduled session", time: "4 hours ago" },
  { id: 3, client: "Emma Davis", action: "Updated goals", time: "1 day ago" },
  { id: 4, client: "Alex Rodriguez", action: "Completed assessment", time: "2 days ago" },
]

const mockUpcomingSessions = [
  { id: 1, client: "Sarah Johnson", time: "Today 2:00 PM", type: "Strength Training" },
  { id: 2, client: "Mike Chen", time: "Today 4:00 PM", type: "Cardio Session" },
  { id: 3, client: "Emma Davis", time: "Tomorrow 9:00 AM", type: "Personal Training" },
  { id: 4, client: "Alex Rodriguez", time: "Tomorrow 11:00 AM", type: "Assessment" },
]

export default function OverviewPageClient() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CCFF00]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your coaching business.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalClients}</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.activeClients}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((mockStats.activeClients / mockStats.totalClients) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${mockStats.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.clientRetention}%</div>
                <p className="text-xs text-muted-foreground">+3% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Your monthly revenue for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your next scheduled sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUpcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-[#CCFF00] rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.client}</p>
                        <p className="text-sm text-gray-500">{session.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates from your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold">{activity.client}</span> {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
