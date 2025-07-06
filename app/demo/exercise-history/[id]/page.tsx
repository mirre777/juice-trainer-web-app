"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trophy } from "lucide-react"
import { useMemo, useState } from "react"
import { useExerciseHistory } from "@/hooks/use-exercise-history"
import { ExerciseHistoryChart } from "@/components/workout/exercise-history-chart"

export default function ExerciseHistoryPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState<"chart" | "sessions">("chart")

  // For demo, use a fixed userId and get exerciseName from the route param
  const userId = "8ogaYAb7xAQp022wfJCowAiWnHB2" // Replace with real userId in prod
  const exerciseId = params.id as string
  const exerciseName = exerciseId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const { sessions, prs, loading, error } = useExerciseHistory(userId, exerciseName)

  // Build chart data for 1RM over time
  const chartData = useMemo(
    () =>
      sessions
        .filter((s) => s.oneRepMax)
        .map((s) => ({
          date:
            typeof s.createdAt === "object" && s.createdAt.seconds
              ? new Date(s.createdAt.seconds * 1000).toISOString().slice(0, 10)
              : String(s.createdAt).slice(0, 10),
          oneRepMax: s.oneRepMax,
        })),
    [sessions],
  )

  // Build a set of PR setIds for quick lookup
  const prSetIds = useMemo(() => new Set(prs.map((pr) => pr.setId)), [prs])

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center py-8 font-['Sen']">
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/demo/client-workout" className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">{exerciseName}</h1>
          </div>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-lg ${activeTab === "chart" ? "bg-lime-400" : "bg-white"}`}
              onClick={() => setActiveTab("chart")}
            >
              Chart
            </button>
            <button
              className={`p-2 rounded-lg ${activeTab === "sessions" ? "bg-lime-400" : "bg-white"}`}
              onClick={() => setActiveTab("sessions")}
            >
              Sessions
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center">Loading...</div>
        ) : error ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-red-500">{error}</div>
        ) : (
          <>
            {activeTab === "chart" && (
              <div className="bg-white rounded-lg shadow p-4">
                <ExerciseHistoryChart
                  entries={chartData.map((d) => ({
                    id: d.date,
                    date: d.date,
                    formattedDate: d.date,
                    weight: `${d.oneRepMax} kg`,
                    reps: 1,
                    sets: 1,
                    totalVolume: d.oneRepMax,
                  }))}
                  title="1RM Progress"
                  timeRange="6m"
                />
              </div>
            )}
            {activeTab === "sessions" && (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-lg shadow p-4">
                    <div className="font-medium mb-2">
                      {typeof session.createdAt === "object" && session.createdAt.seconds
                        ? new Date(session.createdAt.seconds * 1000).toLocaleDateString()
                        : String(session.createdAt)}
                    </div>
                    <div className="space-y-1">
                      {session.sets.map((set, idx) => {
                        const isPR = prSetIds.has(set.id)
                        return (
                          <div
                            key={set.id || idx}
                            className={`flex items-center gap-2 ${isPR ? "bg-yellow-50 rounded px-2 py-1" : ""}`}
                          >
                            <span>
                              Set {idx + 1}: {set.weight} kg × {set.reps} reps
                            </span>
                            {isPR && <Trophy className="w-4 h-4 text-amber-500" title="Personal Record!" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
