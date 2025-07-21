"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, MessageSquare, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import type { FirebaseWorkout } from "@/lib/firebase/workout-service"
import { PersonalRecordsDisplay } from "@/components/shared/personal-records-display"
import { EmojiReaction } from "@/components/shared/emoji-reaction"
import { WeeklyTracker } from "@/components/shared/weekly-tracker"

interface FirebaseWorkoutCardProps {
  workout: FirebaseWorkout
  onRespond?: (id: string) => void
  onClose?: (id: string) => void
  showActions?: boolean
  compact?: boolean
}

export function FirebaseWorkoutCardV2({
  workout,
  onRespond,
  onClose,
  showActions = true,
  compact = false,
}: FirebaseWorkoutCardProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)

  // Refs for overflow detection
  const exercisesContainerRef = useRef<HTMLDivElement>(null)

  // States for overflow detection
  const [exercisesOverflow, setExercisesOverflow] = useState(false)

  // Set active days randomly for demo purposes
  const activeDays = [0, 2, 5] // Monday, Wednesday, Saturday are active

  // Track if a set has a personal record
  const hasPersonalRecord = (index: number): boolean => {
    return index === 0 // For demo, assume first set is a PR
  }

  // Chart data points for exercise progress chart
  const chartDataPoints = [
    { x: 0, y: 180, month: "Jan", value: "120", reps: "3" },
    { x: 80, y: 160, month: "Feb", value: "125", reps: "5" },
    { x: 160, y: 140, month: "Mar", value: "135", reps: "4" },
    { x: 240, y: 110, month: "Apr", value: "145", reps: "3" },
    { x: 320, y: 80, month: "May", value: "150", reps: "2" },
    { x: 400, y: 50, month: "Jun", value: "155", reps: "1" },
  ]

  const [hoverPoint, setHoverPoint] = useState<{
    x: number
    y: number
    month: string
    value: string
    reps: string
  } | null>(null)

  // Check for overflow on mount and resize
  useEffect(() => {
    const checkOverflow = () => {
      if (exercisesContainerRef.current) {
        const container = exercisesContainerRef.current
        setExercisesOverflow(container.scrollWidth > container.clientWidth)
      }
    }

    checkOverflow()
    window.addEventListener("resize", checkOverflow)

    return () => {
      window.removeEventListener("resize", checkOverflow)
    }
  }, [workout.exercises?.length])

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    // Here you would typically send this to your backend
    console.log(`Selected emoji ${emoji} for workout ${workout.id}`)
  }

  const handleExerciseSelect = (id: string) => {
    setSelectedExercise(id === selectedExercise ? null : id)
  }

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - svgRect.left
    const xRatio = x / svgRect.width
    const xValue = xRatio * 400

    // Find the closest data point
    let closestPoint = chartDataPoints[0]
    let minDistance = Math.abs(xValue - closestPoint.x)

    chartDataPoints.forEach((point) => {
      const distance = Math.abs(xValue - point.x)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    })

    setHoverPoint({
      x: closestPoint.x,
      y: closestPoint.y,
      month: closestPoint.month,
      value: closestPoint.value,
      reps: closestPoint.reps,
    })
  }

  const handleChartMouseLeave = () => {
    setHoverPoint(null)
  }

  // Scroll functions for the containers
  const scrollExercises = (direction: "left" | "right") => {
    if (exercisesContainerRef.current) {
      const container = exercisesContainerRef.current
      const scrollAmount = 300 // Adjust as needed

      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  // Get the currently selected exercise data
  const currentExercise = selectedExercise ? workout.exercises?.find((ex) => ex.id === selectedExercise) : null

  // Format duration from seconds to minutes
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "N/A"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full overflow-hidden bg-white shadow-md">
      {/* Client Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            {workout.clientImage ? (
              <Image
                src={workout.clientImage || "/placeholder.svg"}
                alt={workout.clientName || "Client"}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                {/* Salmon placeholder image */}
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-orange-500">
                  <path
                    d="M65.8,44.3c-1.7,0.5-3.3,1.1-4.8,1.9c-2.5,1.2-4.6,2.6-6.4,4.1c-0.9,0.8-1.7,1.6-2.5,2.5 c-1.6-1.7-3.4-3.3-5.5-4.7c-3.1-2.1-6.5-3.7-10.2-4.7c-1.9-0.5-3.9-0.9-5.9-1c-0.5,0-1-0.1-1.4-0.1c-0.4,0-0.7,0-1.1,0 c-0.7,0-1.4,0.1-2.1,0.2c-0.7,0.1-1.4,0.2-2,0.3c-0.7,0.1-1.3,0.3-1.9,0.5c-1.2,0.4-2.3,0.8-3.2,1.4c-0.9,0.6-1.6,1.2-2.1,1.9 c-0.5,0.7-0.8,1.6-0.7,2.4c0.1,0.9,0.5,1.7,1.1,2.4c0.6,0.7,1.3,1.3,2.2,1.9c0.8,0.5,1.7,1,2.7,1.4c0.9,0.4,1.9,0.7,2.9,1 c1,0.3,1.9,0.5,2.8,0.7c0.9,0.2,1.8,0.3,2.6,0.4c0.8,0.1,1.6,0.2,2.3,0.2c0.7,0,1.4,0,2,0c0.6,0,1.2-0.1,1.7-0.2 c1.1-0.2,2-0.4,2.9-0.6c0.8-0.2,1.6-0.5,2.3-0.8c1.4-0.5,2.5-1.1,3.5-1.6c1-0.5,1.8-1,2.5-1.5c0.7-0.5,1.3-0.9,1.8-1.2 c0.3-0.2,0.5-0.3,0.7-0.5c0.2-0.1,0.4-0.2,0.5-0.3c0.4-0.2,0.6-0.4,0.6-0.4s-0.2,0.2-0.5,0.5c-0.2,0.1-0.3,0.3-0.5,0.4 c-0.2,0.2-0.4,0.3-0.7,0.5c-0.5,0.4-1,0.8-1.7,1.3c-0.7,0.5-1.4,1-2.3,1.5c-0.9,0.5-1.9,1.1-3,1.6c-1.1,0.5-2.3,1-3.6,1.5 c-1.3,0.4-2.6,0.8-3.9,1.1c-0.7,0.1-1.3,0.2-2,0.3c-0.7,0.1-1.3,0.1-2,0.1c-0.7,0-1.4,0-2-0.1c-0.7,0-1.3-0.1-2-0.2 c-2.7-0.4-5.2-1-7.3-1.8c-1.1-0.4-2-0.8-2.8-1.3c-0.8-0.4-1.5-0.9-2.1-1.3c-0.6-0.4-1-0.9-1.3-1.2c-0.3-0.4-0.5-0.7-0.6-1 c-0.1-0.3-0.1-0.5,0-0.7c0.1-0.2,0.3-0.4,0.5-0.6c0.5-0.4,1.2-0.8,2.1-1.2c0.9-0.4,2-0.7,3.2-1c0.6-0.1,1.2-0.3,1.9-0.3 c0.6-0.1,1.3-0.2,2-0.2c0.7-0.1,1.3-0.1,2-0.1c0.3,0,0.7,0,1,0c0.3,0,0.7,0,1,0c1.3,0.1,2.7,0.2,4,0.5c2.6,0.5,5.2,1.3,7.5,2.4 c2.4,1.1,4.6,2.4,6.5,3.9c2,1.5,3.7,3.2,5.2,5c0.3,0.4,0.6,0.7,0.9,1.1c0.3-0.3,0.6-0.7,0.9-1c1.4-1.6,3-3.1,4.8-4.5 c1.8-1.4,3.7-2.6,5.8-3.8c2.1-1.1,4.4-2.1,6.7-2.9c1.2-0.4,2.3-0.8,3.5-1.1c1.2-0.3,2.4-0.6,3.6-0.8c1.2-0.2,2.4-0.4,3.6-0.5 c0.6-0.1,1.2-0.1,1.8-0.1c0.6,0,1.2-0.1,1.8-0.1c2.4-0.1,4.7,0,7,0.3c2.3,0.3,4.5,0.8,6.5,1.4c1,0.3,2,0.7,3,1.1 c0.5,0.2,0.9,0.4,1.4,0.6c0.5,0.2,0.9,0.4,1.3,0.6c1.7,0.8,3.3,1.7,4.6,2.6c1.3,0.9,2.4,1.8,3.2,2.7c0.4,0.4,0.8,0.9,1,1.2 c0.1,0.2,0.2,0.4,0.3,0.5c0.1,0.1,0.1,0.2,0.2,0.3c0.1,0.2,0.1,0.3,0.1,0.3s-0.1-0.1-0.2-0.2c-0.1-0.1-0.2-0.2-0.3-0.4 c-0.1-0.1-0.3-0.3-0.4-0.4c-0.3-0.3-0.7-0.7-1.1-1.1c-0.9-0.8-1.9-1.6-3.2-2.4c-1.2-0.8-2.7-1.6-4.3-2.3c-0.8-0.4-1.6-0.7-2.5-1.1 c-0.9-0.3-1.8-0.7-2.7-1c-0.9-0.3-1.9-0.6-2.8-0.8c-1-0.2-1.9-0.5-2.9-0.6c-0.5-0.1-1-0.2-1.5-0.3c-0.5-0.1-1-0.1-1.5-0.2 c-1-0.1-2-0.2-3-0.3c-1-0.1-2-0.1-3-0.1c-0.5,0-1,0-1.5,0c-0.5,0-1,0-1.5,0c-0.5,0-1,0.1-1.5,0.1c-0.5,0-1,0.1-1.5,0.1 C68,43.7,66.9,44,65.8,44.3z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{workout.clientName || "Client"}</h2>
            <p className="text-[14px] text-gray-500">{workout.date || "N/A"}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          {/* Program tags side by side above the weekly tracker */}
          <div className="flex items-center gap-2 mb-2 flex-wrap justify-end">
            {workout.programWeek && workout.programTotal ? (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                Program week {workout.programWeek}/{workout.programTotal}
              </div>
            ) : (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                Duration: {formatDuration(workout.duration)}
              </div>
            )}
            {workout.daysCompleted && workout.daysTotal ? (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                Days {workout.daysCompleted}/{workout.daysTotal}
              </div>
            ) : (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                Status: {workout.status}
              </div>
            )}
          </div>
          <WeeklyTracker activeDays={activeDays} />
        </div>
      </div>

      {/* Workout Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{workout.name || "Untitled Workout"}</h1>
        </div>

        {!compact && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Completion</span>
                <span className="font-medium">
                  {workout.progress?.completed || 0}/{workout.progress?.total || 1} workouts
                </span>
              </div>
              <Progress
                value={((workout.progress?.completed || 0) / (workout.progress?.total || 1)) * 100}
                className="h-2 bg-gray-100"
                indicatorClassName="bg-primary"
              />
            </div>
          </>
        )}

        {/* Client Note (if available) */}
        {workout.notes && (
          <div className="mb-6 pl-4 py-4 bg-gray-50 rounded-lg border-l-4 border-lime-400">
            <p className="font-medium mb-1 text-[14px]">Notes:</p>
            <p className="text-gray-700">{workout.notes}</p>
          </div>
        )}

        {/* Exercise Cards */}
        <div className="mb-8 relative">
          <div
            ref={exercisesContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {workout.exercises?.map((exercise, index) => (
              <div
                key={index}
                className={`flex-shrink-0 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedExercise === exercise.id
                    ? "border-lime-400 bg-lime-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleExerciseSelect(exercise.id)}
              >
                <div className="min-w-[120px]">
                  <div className="flex items-start justify-between">
                    <p className="font-medium mb-1">{exercise.name || "N/A"}</p>
                    {exercise.sets?.some((set) => set.weight > 0) && <Trophy className="w-4 h-4 text-amber-500 ml-1" />}
                  </div>
                  <span className="text-sm text-gray-500">{exercise.sets?.length || 0} sets</span>
                </div>
              </div>
            ))}
          </div>

          {exercisesOverflow && (
            <>
              <button
                className="absolute left-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                onClick={() => scrollExercises("left")}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                onClick={() => scrollExercises("right")}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}
        </div>

        {/* Selected Exercise Details */}
        {selectedExercise && currentExercise && (
          <div className="mb-8 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center mb-4">
              <h3 className="text-[18px] font-semibold">{currentExercise.name || "N/A"}</h3>
              <button className="ml-2 text-xs text-black border-b-2 border-[#D2FF28] px-1 py-0.5 hover:bg-gray-50">
                View history
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col">
                <div className="mb-4">
                  <p className="text-[12px] text-gray-500 mb-1">Latest</p>
                  {currentExercise.sets && currentExercise.sets.length > 0 ? (
                    <p className="text-[14px] font-bold">
                      {currentExercise.sets[0].weight || "N/A"} kg × {currentExercise.sets[0].reps || "N/A"} reps
                    </p>
                  ) : (
                    <p className="text-[14px] font-bold">No sets recorded</p>
                  )}
                </div>

                <div>
                  <p className="text-[12px] text-gray-500 font-medium mb-2">Sets</p>
                  <div className="space-y-3">
                    {currentExercise.sets?.map((set, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-[12px] font-medium">{index + 1}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-[12px]">
                            {set.weight || "N/A"} kg × {set.reps || "N/A"}
                          </span>
                          {hasPersonalRecord(index) && <Trophy className="w-4 h-4 text-amber-500 ml-1" />}
                        </div>
                        {set.notes && <span className="text-[10px] text-gray-500 ml-2">({set.notes})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="flex-1 relative h-[200px] bg-white rounded-lg">
                <div className="absolute top-4 right-4 bg-black text-white text-[12px] px-3 py-1 rounded">
                  {currentExercise.sets && currentExercise.sets.length > 0
                    ? `${currentExercise.sets[0].weight} kg × ${currentExercise.sets[0].reps}`
                    : "No data"}
                </div>

                <svg
                  className="w-full h-full"
                  viewBox="0 0 400 200"
                  preserveAspectRatio="none"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {/* Chart background gradient */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Chart area */}
                  <path
                    d="M0,180 C50,160 100,170 150,140 C200,110 250,130 300,100 C350,70 400,50 400,50 L400,200 L0,200 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Chart line */}
                  <path
                    d="M0,180 C50,160 100,170 150,140 C200,110 250,130 300,100 C350,70 400,50 400,50"
                    fill="none"
                    stroke="#D2FF28"
                    strokeWidth="2"
                  />

                  {/* Current point */}
                  <circle cx="400" cy="50" r="5" fill="black" />

                  {/* Hover point */}
                  {hoverPoint && (
                    <>
                      <circle
                        cx={hoverPoint.x}
                        cy={hoverPoint.y}
                        r="5"
                        fill="#D2FF28"
                        stroke="#D2FF28"
                        strokeWidth="1"
                      />

                      {/* Hover label */}
                      <foreignObject x={hoverPoint.x - 60} y={hoverPoint.y - 30} width="120" height="30">
                        <div
                          className="bg-black text-white text-[12px] px-3 py-1 rounded"
                          style={{
                            position: "absolute",
                            whiteSpace: "nowrap",
                            width: "fit-content",
                            transform: "translateX(-50%)",
                            left: "50%",
                          }}
                        >
                          {`${hoverPoint.value} kg × ${hoverPoint.reps}`}
                        </div>
                      </foreignObject>
                    </>
                  )}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 text-[12px] text-gray-500 uppercase tracking-wide">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Records Section */}
        {workout.personalRecords && workout.personalRecords.length > 0 && (
          <div className="mt-8 mb-6">
            <PersonalRecordsDisplay records={workout.personalRecords} />
          </div>
        )}

        {/* Emoji and Action Buttons */}
        {showActions && (
          <div className="flex justify-between items-center mt-6">
            <EmojiReaction onEmojiSelect={handleEmojiSelect} showComment={false} />

            <div className="flex space-x-2">
              {onRespond && (
                <Button onClick={() => onRespond(workout.id)} className="bg-black text-white hover:bg-black/80">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}

              {onClose && (
                <Button onClick={() => onClose(workout.id)} className="bg-primary text-black hover:bg-primary/80">
                  Close
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Selected Emoji Display */}
        {selectedEmoji && (
          <div className="mt-4 flex justify-center">
            <div className="bg-gray-100 px-3 py-1 rounded-full text-xl">{selectedEmoji}</div>
          </div>
        )}

        {/* Chat button in fixed position */}
        <div className="fixed right-10 bottom-10 z-10">
          <button className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg hover:bg-black/90 transition-all">
            <MessageSquare className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </Card>
  )
}
