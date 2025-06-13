"use client"

import { UnifiedHeader } from "@/components/unified-header"
import { SharedWorkoutCard } from "@/components/shared-workout-card"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"

export default function DashboardPage() {
  // Mock data with proper fallbacks
  const workouts =
    [
      {
        id: "workout-1",
        day: "3",
        focus: "Lower body",
        clientName: "Lisa Martinez",
        progress: {
          completed: 2,
          total: 5,
        },
        exercises: [
          {
            name: "Bench Press",
            target: "85kg",
            sets: 4,
            reps: 10,
          },
          {
            name: "Squats",
            target: "100kg",
            sets: 3,
            reps: 12,
          },
          {
            name: "Deadlift",
            target: "120kg",
            sets: 3,
            reps: 8,
          },
        ],
      },
    ] || [] // Fallback to empty array

  const checkIns =
    [
      {
        id: "1",
        clientName: "Lisa Martinez",
        initials: "LM",
        week: "Week 4/8",
        time: "10:15 AM",
        bgColor: "bg-rose-100",
        textColor: "text-rose-600",
        data: [
          { label: "Sleep Quality", value: "7.5 hours" },
          { label: "Energy Level", value: "8/10" },
          { label: "Stress Level", value: "3/10" },
        ],
      },
      {
        id: "2",
        clientName: "David Kim",
        initials: "DK",
        week: "Week 2/8",
        time: "9:45 AM",
        bgColor: "bg-cyan-100",
        textColor: "text-cyan-600",
        data: [
          { label: "Workout Done", value: "Yes" },
          { label: "Water Intake", value: "2.5L" },
          { label: "Mood", value: "Energetic" },
        ],
      },
    ] || [] // Fallback to empty array

  const clientRequests =
    [
      {
        id: "1",
        name: "Slender Man",
        initials: "SM",
        program: "Weight Loss Program",
        bgColor: "bg-violet-100",
        textColor: "text-violet-600",
      },
      {
        id: "2",
        name: "Choo Choo",
        initials: "CC",
        program: "Muscle Building",
        bgColor: "bg-amber-100",
        textColor: "text-amber-600",
      },
    ] || [] // Fallback to empty array

  const upcomingSessions =
    [
      {
        id: "1",
        time: "11:00 AM",
        clientName: "Ryan Wilson",
        initials: "RW",
        session: "Upper Body Strength",
        bgColor: "bg-green-100",
        textColor: "text-green-600",
      },
      {
        id: "2",
        time: "2:30 PM",
        clientName: "Alicia Johnson",
        initials: "AJ",
        session: "Full Body Assessment",
        bgColor: "bg-pink-100",
        textColor: "text-pink-600",
      },
    ] || [] // Fallback to empty array

  return (
    <div className="bg-white">
      <UnifiedHeader />

      {/* Main Content */}
      <main className="px-24 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <SharedWorkoutCard
                workouts={workouts}
                onRespond={(id) => console.log(`Responding to workout ${id}`)}
                onClose={(id) => console.log(`Closing workout ${id}`)}
              />

              {/* Check-ins */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Check-ins</h2>

                <div className="space-y-4">
                  {checkIns?.length > 0 ? (
                    checkIns.map((checkIn) => (
                      <div key={checkIn.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 ${checkIn.bgColor} rounded-full flex items-center justify-center`}
                            >
                              <span className={`${checkIn.textColor} font-medium`}>{checkIn.initials}</span>
                            </div>
                            <div>
                              <p className="font-medium">{checkIn.clientName}</p>
                              <p className="text-gray-500 text-sm">{checkIn.week}</p>
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs">{checkIn.time}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {checkIn.data?.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-500 text-xs">{item.label}</p>
                              <p className="font-medium">{item.value}</p>
                            </div>
                          )) || null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No check-ins available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Revenue Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>

                <div className="grid grid-cols-2 gap-4">
                  <ComingSoonOverlay message="Revenue Tracking Coming Soon">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-500 text-sm">This Month</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">€4,850</p>
                        <p className="text-green-600 text-sm">+12%</p>
                      </div>
                    </div>
                  </ComingSoonOverlay>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 text-sm">Active Clients</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-green-600 text-sm">+3 this month</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Client Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">New Client Requests</h2>
                  <a href="#" className="text-zinc-700 text-sm underline">
                    View All
                  </a>
                </div>

                <div className="space-y-4">
                  {clientRequests?.length > 0 ? (
                    clientRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-100 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${request.bgColor} rounded-full flex items-center justify-center`}>
                            <span className={`${request.textColor} font-medium`}>{request.initials}</span>
                          </div>
                          <div>
                            <p className="font-medium">{request.name}</p>
                            <p className="text-gray-500 text-sm">{request.program}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm">Decline</button>
                          <button className="px-3 py-1 bg-lime-300 rounded-lg text-sm">Accept</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No client requests</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                  <a href="#" className="text-zinc-700 text-sm underline">
                    View All Sessions
                  </a>
                </div>

                <ComingSoonOverlay message="Sessions Coming Soon">
                  <div className="space-y-3">
                    {upcomingSessions?.length > 0 ? (
                      upcomingSessions.map((session) => (
                        <div key={session.id} className="border border-gray-100 rounded-lg p-3 flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-gray-500 text-sm">{session.time}</p>
                          </div>
                          <div className={`w-10 h-10 ${session.bgColor} rounded-full flex items-center justify-center`}>
                            <span className={`${session.textColor} font-medium`}>{session.initials}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{session.clientName}</p>
                            <p className="text-gray-500 text-sm">{session.session}</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-full flex items-center justify-center">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect width="14" height="14" x="1" y="1" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M5 13V5" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </button>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="8" cy="8" r="1" fill="currentColor" />
                                <circle cx="12" cy="8" r="1" fill="currentColor" />
                                <circle cx="4" cy="8" r="1" fill="currentColor" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>No upcoming sessions. Schedule sessions from the Calendar page.</p>
                        <button className="mt-4 px-4 py-2 bg-lime-300 rounded-lg text-sm">Sync Calendar</button>
                      </div>
                    )}
                  </div>
                </ComingSoonOverlay>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
