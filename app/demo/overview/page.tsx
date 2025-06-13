"use client"
import { ClientWorkoutView } from "@/components/client-workout-view"
import { OverviewPageLayout } from "@/components/layout/overview-page-layout"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

// Mock data for demo mode
const mockClientWorkout = {
  client: {
    id: "client-1",
    name: "Lisa Martinez",
    date: "April 25, 2025",
    programWeek: "4",
    programTotal: "8",
    daysCompleted: "2",
    daysTotal: "5",
  },
  workout: {
    day: "2",
    focus: "Lower Body",
    clientNote:
      "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
  },
  exercises: [
    {
      id: "ex-1",
      name: "Back Squat",
      weight: "120 kg",
      reps: "5",
      completed: true,
      sets: [
        { number: 1, weight: "120 kg", reps: "5" },
        { number: 2, weight: "120 kg", reps: "5" },
        { number: 3, weight: "120 kg", reps: "5" },
      ],
    },
    {
      id: "ex-2",
      name: "Romanian DL",
      weight: "100 kg",
      reps: "10",
      completed: false,
    },
    {
      id: "ex-3",
      name: "Leg Press",
      weight: "200 kg",
      reps: "10",
      completed: true,
      isPR: true,
      sets: [
        { number: 1, weight: "200 kg", reps: "10", isPR: true },
        { number: 2, weight: "200 kg", reps: "8" },
        { number: 3, weight: "180 kg", reps: "12" },
      ],
    },
    {
      id: "ex-4",
      name: "Leg Extension",
      weight: "70 kg",
      reps: "12",
      completed: true,
    },
    {
      id: "ex-5",
      name: "Calf Raise",
      weight: "50 kg",
      reps: "15",
      completed: true,
    },
  ],
  personalRecords: [
    {
      exercise: "Bench Press",
      weight: "85 kg",
      reps: "5 reps",
      date: "April 18, 2025",
    },
    {
      exercise: "Deadlift",
      weight: "180 kg",
      reps: "3 reps",
      date: "April 11, 2025",
    },
    {
      exercise: "Squat",
      weight: "140 kg",
      reps: "5 reps",
      date: "April 4, 2025",
    },
  ],
}

const mockCheckIns = [
  { id: "1", client: "Ryan Wilson", date: "April 24, 2025", content: "Completed all workouts this week!" },
  { id: "2", client: "Sarah Johnson", date: "April 23, 2025", content: "Struggling with recovery after leg day." },
]

const mockRevenue = {
  thisMonth: "€4,850",
  activeClients: 12,
}

const mockSessions = [
  { id: "1", client: "Michael Chen", time: "Tomorrow, 10:00 AM", type: "Strength Training" },
  { id: "2", client: "Emma Davis", time: "Friday, 2:00 PM", type: "Assessment" },
  { id: "3", client: "David Kim", time: "Monday, 3:30 PM", type: "Consultation" },
]

const mockClientRequests = [
  { id: "1", name: "Jessica Taylor", email: "jessica@example.com", date: "Today, 9:15 AM", status: "New" },
  { id: "2", name: "Marcus Johnson", email: "marcus@example.com", date: "Yesterday", status: "Pending" },
]

export default function DemoOverviewPage() {
  // Always use demo data in demo pages
  const isDemo = true

  return (
    <OverviewPageLayout isDemo={true}>
      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Client Workout View */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                {isDemo ? (
                  <ClientWorkoutView
                    client={mockClientWorkout.client}
                    workout={mockClientWorkout.workout}
                    exercises={mockClientWorkout.exercises}
                    personalRecords={mockClientWorkout.personalRecords}
                    onEmojiSelect={() => {}}
                    onComment={() => {}}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <PlusCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No recent workouts</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      Your clients' recent workouts will appear here once they complete them.
                    </p>
                    <Link href="/demo/clients">
                      <button className="inline-flex items-center justify-center px-4 py-2 bg-[#CCFF00] text-black font-medium rounded-md hover:bg-[#b8e600] transition-colors">
                        Add Client
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Check-ins */}
              <ComingSoonOverlay message="Check-ins Coming Soon">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold mb-4">Check-ins</h2>
                  {isDemo ? (
                    <div className="space-y-4">
                      {mockCheckIns.map((checkIn) => (
                        <div key={checkIn.id} className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex justify-between">
                            <span className="font-medium">{checkIn.client}</span>
                            <span className="text-sm text-gray-500">{checkIn.date}</span>
                          </div>
                          <p className="mt-1 text-gray-700">{checkIn.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-gray-500 mb-4">No check-ins yet. Client check-ins will appear here.</p>
                    </div>
                  )}
                </div>
              </ComingSoonOverlay>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Quick Stats (formerly Revenue Overview) */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-1 gap-4">
                  {/* Total Clients - NO OVERLAY */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 text-sm">Total Clients</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">120</p>
                      <span className="text-green-500 text-sm">+3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Sessions - WITH OVERLAY */}
              <ComingSoonOverlay message="Sessions Coming Soon">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[200px]">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                    <Link href="/demo/calendar" className="text-zinc-700 text-sm underline">
                      View All Sessions
                    </Link>
                  </div>

                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-gray-500 mb-4">
                      No upcoming sessions. Schedule sessions from the Calendar page.
                    </p>
                    <Link href="/demo/calendar">
                      <button className="inline-flex items-center justify-center px-4 py-2 bg-[#CCFF00] text-black font-medium rounded-md hover:bg-[#b8e600] transition-colors">
                        Sync Calendar
                      </button>
                    </Link>
                  </div>
                </div>
              </ComingSoonOverlay>

              {/* New Client Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">New Client Requests</h2>
                  <Link href="/marketplace" className="text-zinc-700 text-sm underline">
                    View All
                  </Link>
                </div>

                {isDemo ? (
                  <div className="space-y-4">
                    {mockClientRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-gray-500">{request.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{request.date}</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-gray-500 mb-4">No client requests yet. New requests will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </OverviewPageLayout>
  )
}
