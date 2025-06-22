// ⚠️ REDUNDANT COMPONENT - DO NOT USE
// This component is being phased out in favor of ClientWorkoutView
// Keeping for reference until migration is complete
// TODO: Remove after confirming all usage has been migrated to ClientWorkoutView

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, MessageSquare, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

interface Exercise {
  name: string
  target: string
  sets?: number
  reps?: number
  completed?: boolean
  isPR?: boolean
}

interface PersonalRecord {
  exercise: string
  weight: string
  reps: number
  date: string
  isPR?: boolean
}

interface SharedWorkoutCardv2Props {
  workout: {
    id: string
    day: string
    focus: string
    clientName: string
    clientImage?: string
    date?: string
    programWeek?: string
    programTotal?: string
    daysCompleted?: string
    daysTotal?: string
    clientNote?: string
    progress: {
      completed: number
      total: number
    }
    exercises: Exercise[]
    personalRecords?: PersonalRecord[]
  }
  onRespond?: (id: string) => void
  onClose?: (id: string) => void
  showActions?: boolean
  compact?: boolean
}

export function SharedWorkoutCardv2({
  workout,
  onRespond,
  onClose,
  showActions = true,
  compact = false,
}: SharedWorkoutCardv2Props) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationEmoji, setAnimationEmoji] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)

  // Refs for overflow detection
  const exercisesContainerRef = useRef<HTMLDivElement>(null)
  const personalRecordsRef = useRef<HTMLDivElement>(null)

  // States for overflow detection
  const [exercisesOverflow, setExercisesOverflow] = useState(false)
  const [recordsOverflow, setRecordsOverflow] = useState(false)

  // States for scroll position
  const [showLeftExerciseArrow, setShowLeftExerciseArrow] = useState(false)
  const [showRightExerciseArrow, setShowRightExerciseArrow] = useState(true)
  const [showLeftRecordArrow, setShowLeftRecordArrow] = useState(false)
  const [showRightRecordArrow, setShowRightRecordArrow] = useState(true)

  const emojis = ["💪", "🔥", "👏", "⭐", "🚀", "✨"]

  // Days of week for weekly tracker
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"]

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
        const hasOverflow = container.scrollWidth > container.clientWidth
        setExercisesOverflow(hasOverflow)

        // Update arrow visibility based on scroll position
        setShowLeftExerciseArrow(container.scrollLeft > 0)
        setShowRightExerciseArrow(
          hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 10,
        )
      }

      if (personalRecordsRef.current) {
        const container = personalRecordsRef.current
        const hasOverflow = container.scrollWidth > container.clientWidth
        setRecordsOverflow(hasOverflow)

        // Update arrow visibility based on scroll position
        setShowLeftRecordArrow(container.scrollLeft > 0)
        setShowRightRecordArrow(
          hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 10,
        )
      }
    }

    checkOverflow()
    window.addEventListener("resize", checkOverflow)

    // Add scroll event listeners to update arrow visibility
    const exercisesContainer = exercisesContainerRef.current
    const recordsContainer = personalRecordsRef.current

    if (exercisesContainer) {
      exercisesContainer.addEventListener("scroll", () => {
        setShowLeftExerciseArrow(exercisesContainer.scrollLeft > 0)
        setShowRightExerciseArrow(
          exercisesContainer.scrollLeft < exercisesContainer.scrollWidth - exercisesContainer.clientWidth - 10,
        )
      })
    }

    if (recordsContainer) {
      recordsContainer.addEventListener("scroll", () => {
        setShowLeftRecordArrow(recordsContainer.scrollLeft > 0)
        setShowRightRecordArrow(
          recordsContainer.scrollLeft < recordsContainer.scrollWidth - recordsContainer.clientWidth - 10,
        )
      })
    }

    return () => {
      window.removeEventListener("resize", checkOverflow)
      if (exercisesContainer) {
        exercisesContainer.removeEventListener("scroll", () => {})
      }
      if (recordsContainer) {
        recordsContainer.removeEventListener("scroll", () => {})
      }
    }
  }, [workout.exercises.length])

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    setAnimationEmoji(emoji)
    setShowAnimation(true)
    // Here you would typically send this to your backend
    console.log(`Selected emoji ${emoji} for workout ${workout.id}`)

    // Reset animation after it completes
    setTimeout(() => {
      setShowAnimation(false)
    }, 3000)
  }

  const handleExerciseSelect = (name: string) => {
    setSelectedExercise(name === selectedExercise ? null : name)
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

  const scrollRecords = (direction: "left" | "right") => {
    if (personalRecordsRef.current) {
      const container = personalRecordsRef.current
      const scrollAmount = 300 // Adjust as needed

      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  // Get the currently selected exercise data
  const currentExercise = selectedExercise ? workout.exercises.find((ex) => ex.name === selectedExercise) : null

  // Emoji Animation component
  const EmojiAnimation = ({ show, emoji, onComplete }: { show: boolean; emoji: string; onComplete: () => void }) => {
    useEffect(() => {
      if (show) {
        const timer = setTimeout(() => {
          onComplete()
        }, 3000)
        return () => clearTimeout(timer)
      }
    }, [show, onComplete])

    if (!show) return null

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const size = Math.random() * 16 + 8
          const duration = Math.random() * 1.5 + 1.5
          const left = Math.random() * 100
          const delay = Math.random() * 0.5
          return (
            <div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${left}%`,
                animation: `float-up ${duration}s ease-out ${delay}s forwards`,
                fontSize: `${size}px`,
                opacity: 0,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              {emoji}
            </div>
          )
        })}
        <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100%) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(${Math.random() * 720 - 360}deg);
            opacity: 0;
          }
        }
      `}</style>
      </div>
    )
  }

  // Weekly tracker dots component
  const WeeklyTracker = () => (
    <div className="flex items-center gap-2">
      {daysOfWeek.map((day, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            activeDays.includes(i) ? "bg-lime-300 text-black" : "bg-gray-200 text-gray-500"
          }`}
        >
          {day}
        </div>
      ))}
    </div>
  )

  return (
    <Card className="w-full overflow-hidden bg-white shadow-md">
      {/* Emoji animation container */}
      <EmojiAnimation show={showAnimation} emoji={animationEmoji} onComplete={() => setShowAnimation(false)} />

      {/* Client Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            {workout.clientImage ? (
              <Image
                src={workout.clientImage || "/placeholder.svg"}
                alt={workout.clientName}
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
            <h2 className="text-xl font-bold">{workout.clientName}</h2>
            <p className="text-[14px] text-gray-500">{workout.date || "Today"}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          {/* Program tags side by side above the weekly tracker */}
          <div className="flex items-center gap-2 mb-2 flex-wrap justify-end">
            {workout.programWeek && workout.programTotal && (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                Program week {workout.programWeek}/{workout.programTotal}
              </div>
            )}
            {workout.daysCompleted && workout.daysTotal && (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-800">
                Days {workout.daysCompleted}/{workout.daysTotal}
              </div>
            )}
          </div>
          <WeeklyTracker />
        </div>
      </div>

      {/* Workout Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Day {workout.day} - {workout.focus}
          </h1>
        </div>

        {!compact && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">This Week</span>
                <span className="font-medium">
                  {workout.progress.completed}/{workout.progress.total} workouts
                </span>
              </div>
              <Progress
                value={(workout.progress.completed / workout.progress.total) * 100}
                className="h-2 bg-gray-200"
                indicatorClassName="bg-lime-400"
              />
            </div>
          </>
        )}

        {/* Client Note (if available) */}
        {workout.clientNote && (
          <div className="mb-6 pl-4 py-4 bg-gray-50 rounded-lg border-l-4 border-lime-400">
            <p className="font-medium mb-1 text-[14px]">Client Note:</p>
            <p className="text-gray-700">{workout.clientNote}</p>
          </div>
        )}

        {/* Exercise Cards */}
        <div className="mb-8 relative">
          <div
            ref={exercisesContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {workout.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`flex-shrink-0 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedExercise === exercise.name
                    ? "border-lime-400 bg-lime-50"
                    : exercise.completed === false
                      ? "border-amber-200 bg-amber-50"
                      : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleExerciseSelect(exercise.name)}
              >
                <div className="min-w-[120px]">
                  <div className="flex items-start justify-between">
                    <p className="font-medium mb-1">{exercise.name}</p>
                    {exercise.isPR && <Trophy className="w-4 h-4 text-amber-500 ml-1" />}
                  </div>
                  {exercise.completed === false ? (
                    <span className="text-sm text-amber-500">Not Completed</span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {exercise.target} × {exercise.sets || "5"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Only show arrows when needed */}
          {exercisesOverflow && (
            <>
              {showLeftExerciseArrow && (
                <button
                  className="absolute left-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                  onClick={() => scrollExercises("left")}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {showRightExerciseArrow && (
                <button
                  className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                  onClick={() => scrollExercises("right")}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Selected Exercise Details */}
        {selectedExercise && currentExercise && (
          <div className="mb-8 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center mb-4">
              <h3 className="text-[18px] font-semibold">{currentExercise.name}</h3>
              <button className="ml-2 text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded">View history</button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col">
                <div className="mb-4">
                  <p className="text-[12px] text-gray-500 mb-1">Latest</p>
                  <p className="text-[14px] font-bold">
                    {currentExercise.target} × {currentExercise.reps || "10"} reps
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-gray-500 font-medium mb-2">Sets</p>
                  <div className="space-y-3">
                    {[1, 2, 3].map((setNum) => (
                      <div key={setNum} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-[12px] font-medium">{setNum}</span>
                        </div>
                        <span className="text-[12px]">
                          {currentExercise.target} × {currentExercise.reps || "10"}
                        </span>
                        {hasPersonalRecord(setNum - 1) && <Trophy className="w-4 h-4 text-amber-500 ml-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="flex-1 relative h-[200px] bg-white rounded-lg">
                <div className="absolute top-4 right-4 bg-black text-white text-[12px] px-3 py-1 rounded">
                  155 kg × 1 rep
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
                      <stop offset="0%" stopColor="#D2FF28" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#D2FF28" stopOpacity="0" />
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
            <h3 className="text-lg font-semibold mb-4">Recent Personal Records</h3>
            <div className="relative">
              <div
                ref={personalRecordsRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {workout.personalRecords.map((record, index) => (
                  <div key={index} className="flex-shrink-0 border border-gray-200 rounded-lg p-4 w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{record.exercise}</h4>
                      {record.isPR && <Trophy className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-2xl font-bold mb-1">{record.weight}</p>
                    <p className="text-sm text-gray-500 mb-2">{record.reps} reps</p>
                    <p className="text-xs text-gray-400">{record.date}</p>
                  </div>
                ))}
              </div>

              {recordsOverflow && (
                <>
                  {showLeftRecordArrow && (
                    <button
                      className="absolute left-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                      onClick={() => scrollRecords("left")}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  {showRightRecordArrow && (
                    <button
                      className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                      onClick={() => scrollRecords("right")}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Emoji and Action Buttons */}
        {showActions && (
          <div className="flex justify-between items-center mt-6">
            <div className="flex space-x-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-all shadow hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              {onRespond && (
                <Button onClick={() => onRespond(workout.id)} className="bg-black text-white hover:bg-gray-800">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}

              {onClose && (
                <Button onClick={() => onClose(workout.id)} className="bg-lime-300 text-black hover:bg-lime-400">
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
          <button className="w-12 h-12 bg-lime-300 rounded-full flex items-center justify-center shadow-lg hover:bg-lime-400 transition-all">
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Card>
  )
}
