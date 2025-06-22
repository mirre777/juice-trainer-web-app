"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp, MessageSquare, SmilePlus, Trophy } from "lucide-react"

export interface WorkoutCardProps {
  title?: string
  status?: string
  clientNotes?: string
  personalRecords?: Array<{
    exercise: string
    weight: number
    date: string
  }>
  exercises?: Array<{
    name: string
    latest: string
    pr: string
    sets: string[]
  }>
}

export function WorkoutCard({
  title = "Day 2 - Lower Body",
  status = "Completed",
  clientNotes = "Felt strong today but had some tightness in my right hamstring during Romanian deadlifts. Reduced the weight slightly for the last two sets.",
  personalRecords = [
    {
      exercise: "Bench Press",
      weight: 85,
      date: "April 18, 2025",
    },
    {
      exercise: "Deadlift",
      weight: 180,
      date: "April 11, 2025",
    },
    {
      exercise: "Squat",
      weight: 140,
      date: "April 4, 2025",
    },
    {
      exercise: "Shoulder Press",
      weight: 45,
      date: "March 28, 2025",
    },
  ],
  exercises = [
    {
      name: "Squat",
      latest: "120 kg × 5 reps",
      pr: "120 kg × 5",
      sets: ["80 kg × 5", "100 kg × 5", "120 kg × 5"],
    },
    {
      name: "Romanian Deadlift",
      latest: "100 kg × 8 reps",
      pr: "110 kg × 6",
      sets: ["70 kg × 8", "85 kg × 8", "100 kg × 8"],
    },
    {
      name: "Leg Press",
      latest: "200 kg × 10 reps",
      pr: "220 kg × 8",
      sets: ["160 kg × 10", "180 kg × 10", "200 kg × 10"],
    },
    {
      name: "Leg Extension",
      latest: "70 kg × 12 reps",
      pr: "80 kg × 10",
      sets: ["50 kg × 12", "60 kg × 12", "70 kg × 12"],
    },
    {
      name: "Seated Calf Raise",
      latest: "50 kg × 15 reps",
      pr: "60 kg × 12",
      sets: ["30 kg × 15", "40 kg × 15", "50 kg × 15"],
    },
  ],
}: WorkoutCardProps) {
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({})

  const toggleExercise = (id: string) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Convert exercise name to ID
  const getExerciseId = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-")
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-4">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Sen:wght@400;500;600;700;800&display=swap');
          
          .workout-card-content * {
            font-family: 'Sen', sans-serif;
          }
          
          .workout-card-content h1 {
            font-size: 32px;
          }
          
          .workout-card-content h2 {
            font-size: 28px;
          }
          
          .workout-card-content .card-title {
            font-size: 18px;
          }
          
          .workout-card-content p, 
          .workout-card-content .text-sm {
            font-size: 14px;
          }
        `}</style>

        <div className="workout-card-content">
          {/* Workout Header */}
          <div className="pb-4 flex justify-between items-center">
            <h1 className="font-bold">{title}</h1>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="text-gray-600">{status}</span>
            </div>
          </div>

          {/* Client Notes */}
          {clientNotes && (
            <div className="pb-4">
              <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-[#d2ff28]">
                <div className="pb-1">
                  <h3 className="text-base font-medium">Client notes:</h3>
                </div>
                <p className="text-gray-700">{clientNotes}</p>
              </div>
            </div>
          )}

          {/* Personal Records Section */}
          {personalRecords && personalRecords.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold mb-3">Personal Records</h2>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {personalRecords.map((record, index) => (
                  <div
                    key={index}
                    className="min-w-[224px] h-28 p-3 bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-100 flex flex-col"
                  >
                    <div className="pb-1">
                      <div className="flex justify-between items-center">
                        <div className="text-base font-medium">{record.exercise}</div>
                        <div className="w-6 h-6 bg-[#d2ff28]/20 rounded-full flex justify-center items-center">
                          <Trophy className="w-3.5 h-3.5 text-gray-800" />
                        </div>
                      </div>
                    </div>
                    <div className="pb-0.5">
                      <div className="text-2xl font-bold">{record.weight} kg</div>
                    </div>
                    <div>
                      <div className="text-gray-500">{record.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Card containing all exercises */}
          {exercises && exercises.length > 0 && (
            <Card className="border border-gray-100 mb-3">
              <CardContent className="p-0">
                {/* Exercise Items */}
                <div className="divide-y divide-gray-100">
                  {exercises.map((exercise) => {
                    const exerciseId = getExerciseId(exercise.name)
                    const isExpanded = expandedExercises[exerciseId] || false

                    return (
                      <div key={exerciseId} className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="card-title font-semibold">{exercise.name}</h3>
                          <button
                            onClick={() => toggleExercise(exerciseId)}
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        <div>
                          <p className="text-gray-500 pb-0.5">Latest</p>
                          <p className="text-base font-bold">{exercise.latest}</p>
                        </div>

                        {isExpanded && (
                          <div className="mt-4">
                            <div className="flex flex-col mb-4">
                              <div>
                                <p className="text-gray-500 pb-0.5">All-time PR</p>
                                <p className="text-base font-bold">{exercise.pr}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                              {/* Left side - Exercise info */}
                              <div className="col-span-4">
                                <h4 className="text-base font-medium mb-1.5">Completed this workout</h4>
                                <div className="space-y-1">
                                  {exercise.sets.map((set, index) => (
                                    <p key={index}>{set}</p>
                                  ))}
                                </div>
                              </div>

                              {/* Right side - Chart */}
                              <div className="col-span-8">
                                <div className="bg-white rounded-lg p-3 h-full">
                                  <div className="text-xs font-bold text-slate-800 mb-1">1 Rep max</div>
                                  <div className="relative h-28">
                                    {/* Chart visualization */}
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-[#d2ff28]/30 to-white mix-blend-multiply">
                                      <svg viewBox="0 0 300 100" className="w-full h-full">
                                        <path
                                          d="M0,80 C30,60 60,90 90,70 C120,50 150,80 180,60 C210,40 240,50 270,20 L270,100 L0,100 Z"
                                          fill={`url(#gradient-${exerciseId})`}
                                          stroke="#000000"
                                          strokeWidth="2"
                                        />
                                        <defs>
                                          <linearGradient
                                            id={`gradient-${exerciseId}`}
                                            x1="0%"
                                            y1="0%"
                                            x2="0%"
                                            y2="100%"
                                          >
                                            <stop offset="0%" stopColor="#d2ff28" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#d2ff28" stopOpacity="0.1" />
                                          </linearGradient>
                                        </defs>
                                      </svg>
                                    </div>

                                    {/* End point with vertical line */}
                                    <div className="absolute bottom-0 right-12 h-full flex items-end">
                                      <div className="w-0.5 h-24 bg-black"></div>
                                      <div className="absolute bottom-24 right-0 w-3 h-3 bg-black rounded-full border-2 border-black/70 shadow-[0px_8px_8px_0px_rgba(13,10,44,0.08)]"></div>
                                    </div>
                                  </div>

                                  {/* Month labels */}
                                  <div className="flex justify-between mt-1">
                                    {["JAN", "FEB", "MAR", "APR", "MAY", "JUN"].map((month) => (
                                      <div
                                        key={month}
                                        className="text-[9px] text-gray-500 font-normal uppercase tracking-wide"
                                      >
                                        {month}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Max weight label */}
                                  <div className="absolute top-3 right-3 bg-black text-white text-xs font-medium px-2 py-0.5 rounded">
                                    {Number.parseInt(exercise.pr) + 35} kg
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Action buttons at the bottom of the entire card */}
                <div className="flex items-center space-x-2 p-4 border-t border-gray-100">
                  {/* Emoji Reaction Button */}
                  <button className="w-8 h-8 bg-primary rounded-full shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] flex justify-center items-center">
                    <SmilePlus className="w-4 h-4 text-[#374151]" />
                  </button>

                  {/* Quick Message Button */}
                  <button className="w-8 h-8 bg-black rounded-full shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] flex justify-center items-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
