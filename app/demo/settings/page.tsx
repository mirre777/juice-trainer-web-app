"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { PageLayout } from "@/components/shared/page-layout"

export default function SettingsPage() {
  const [activeNavItem, setActiveNavItem] = useState("connected-apps")
  const isDemo = true

  // Sample connected apps data - already has mock data
  const connectedApps = [
    {
      id: "fitbit",
      name: "Fitbit",
      description: "Activity & sleep tracking",
      lastSync: "Today, 9:45 AM",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      connected: true,
    },
    {
      id: "myfitnesspal",
      name: "MyFitnessPal",
      description: "Nutrition & calorie tracking",
      lastSync: "Today, 8:30 AM",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      connected: true,
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Schedule management",
      lastSync: "Yesterday, 5:15 PM",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      connected: true,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing",
      lastSync: "2 days ago",
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
      connected: true,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Team communication",
      lastSync: "3 days ago",
      bgColor: "bg-cyan-100",
      textColor: "text-cyan-600",
      connected: true,
    },
  ]

  return (
    <PageLayout title="Settings" description="Manage your account preferences">
      <div className="flex gap-8">
        {/* Navigation Sidebar */}
        <div className="w-96">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                <button
                  className={`px-4 py-2 text-left rounded-lg ${activeNavItem === "profile" ? "bg-lime-300 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setActiveNavItem("profile")}
                >
                  Profile Settings
                </button>
                <button
                  className={`px-4 py-2 text-left rounded-lg mt-2 ${activeNavItem === "notifications" ? "bg-lime-300 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setActiveNavItem("notifications")}
                >
                  Notifications
                </button>
                <button
                  className={`px-4 py-2 text-left rounded-lg mt-2 ${activeNavItem === "privacy" ? "bg-lime-300 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setActiveNavItem("privacy")}
                >
                  Privacy & Security
                </button>
                <button
                  className={`px-4 py-2 text-left rounded-lg mt-2 ${activeNavItem === "billing" ? "bg-lime-300 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setActiveNavItem("billing")}
                >
                  Billing & Subscription
                </button>
                <button
                  className={`px-4 py-2 text-left rounded-lg mt-2 ${activeNavItem === "connected-apps" ? "bg-lime-300 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setActiveNavItem("connected-apps")}
                >
                  Connected Apps
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Connected Apps</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  className="pl-9 pr-4 py-2 w-64 bg-white rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Currently Connected (5)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {connectedApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl border border-gray-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className={`w-10 h-10 ${app.bgColor} rounded-2xl flex items-center justify-center`}>
                          <span className={`${app.textColor}`}>{app.name.charAt(0)}</span>
                        </div>
                        <Switch checked={app.connected} />
                      </div>
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-gray-500">{app.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <svg
                            className="w-3 h-3 mr-1"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6 3V6L8 7M10 6C10 8.20914 8.20914 10 6 10C3.79086 10 2 8.20914 2 6C2 3.79086 3.79086 2 6 2C8.20914 2 10 3.79086 10 6Z"
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {app.lastSync}
                        </div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-gray-100 hidden group-hover:flex">
                        <div className="flex justify-between w-full">
                          <button className="text-xs text-gray-600">Permissions</button>
                          <button className="text-xs text-red-600">Disconnect</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Available Integrations</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5" />
                    </div>
                    <p className="font-medium">Connect New App</p>
                    <p className="text-sm text-center mt-1">Browse available integrations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
