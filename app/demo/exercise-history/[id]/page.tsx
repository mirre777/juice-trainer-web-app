"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, BarChart3, Table } from "lucide-react"
import { ExerciseHistoryChart } from "@/components/workout/exercise-history-chart"
import { ExerciseHistoryTable } from "@/components/workout/exercise-history-table"
import { ExerciseMetrics } from "@/components/workout/exercise-metrics"
import { type ExerciseHistory, generateMockExerciseHistory } from "@/types/exercise-history"

export default function ExerciseHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const [history, setHistory] = useState<ExerciseHistory | null>(null)
  const [activeTab, setActiveTab] = useState<"chart" | "table">("chart")

  // Get exercise ID from URL
  const exerciseId = params.id as string

  // Fetch exercise history data
  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For now, we'll generate mock data
    const exerciseName = exerciseId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    const mockHistory = generateMockExerciseHistory(exerciseName)
    setHistory(mockHistory)
  }, [exerciseId])

  if (!history) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex justify-center py-8">
        <div className="w-full max-w-[800px] flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center py-8 font-['Sen']">
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/demo/client-workout" className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">{history.exerciseName}</h1>
          </div>

          <div className="flex gap-2">
            <button
              className={`p-2 rounded-lg ${activeTab === "chart" ? "bg-lime-400" : "bg-white"}`}
              onClick={() => setActiveTab("chart")}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded-lg ${activeTab === "table" ? "bg-lime-400" : "bg-white"}`}
              onClick={() => setActiveTab("table")}
            >
              <Table className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <ExerciseMetrics history={history} />

        {/* Chart or Table */}
        {activeTab === "chart" ? (
          <ExerciseHistoryChart entries={history.entries} />
        ) : (
          <ExerciseHistoryTable entries={history.entries} />
        )}

        {/* Related exercises */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Related Exercises</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["Squat", "Front Squat", "Leg Press", "Lunges"].map((exercise) => (
              <Link
                key={exercise}
                href={`/demo/exercise-history/${exercise.toLowerCase().replace(/\s+/g, "-")}`}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {exercise}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
