"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Circle, Trophy, MessageCircle } from "lucide-react"

interface Exercise {
  id: string
  name: string
  weight?: string
  reps?: string
  completed?: boolean
  isPR?: boolean
  sets?: Array<{
    number: number
    weight: string
    reps: string
    isPR?: boolean
  }>
}

interface Client {
  id: string
  name: string
  image: string
  date: string
  programWeek: string
  programTotal: string
  daysCompleted: string
  daysTotal: string
}

interface Workout {
  day: string
  focus: string
  clientNote?: string
}

interface PersonalRecord {
  exercise: string
  weight: string
  date: string
}

interface ClientWorkoutViewProps {
  client: Client
  workout: Workout
  exercises: Exercise[]
  personalRecords?: PersonalRecord[]
  onEmojiSelect?: (emoji: string) => void
  onComment?: (comment: string) => void
  showInteractionButtons?: boolean
  isMockData?: boolean
  allClientWorkouts?: any[]
  weeklyWorkouts?: any[]
}

export function ClientWorkoutView({
  client,
  workout,
  exercises = [],
  personalRecords = [],
  onEmojiSelect,
  onComment,
  showInteractionButtons = true,
  isMockData = false,
}: ClientWorkoutViewProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [showCommentBox, setShowCommentBox] = useState(false)

  const completedExercises = exercises.filter((ex) => ex.completed).length
  const totalExercises = exercises.length
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(emoji)
    onEmojiSelect?.(emoji)
  }

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      onComment?.(comment)
      setComment("")
      setShowCommentBox(false)
    }
  }

  const emojis = [
    { emoji: "❤️", label: "Love" },
    { emoji: "👍", label: "Good job" },
    { emoji: "🔥", label: "Fire" },
    { emoji: "💪", label: "Strong" },
    { emoji: "🎯", label: "On target" },
    { emoji: "⚡", label: "Energy" },
  ]

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.image || "/placeholder.svg"} alt={client.name} />
            <AvatarFallback>
              {client.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{client.name}</h2>
            <p className="text-sm text-gray-600">{client.date}</p>
          </div>
        </div>

        {/* Program Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Program Progress</span>
            <span className="font-medium">
              Week {client.programWeek} of {client.programTotal}
            </span>
          </div>
          <Progress
            value={(Number.parseInt(client.programWeek) / Number.parseInt(client.programTotal)) * 100}
            className="h-2"
          />

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">This Week</span>
            <span className="font-medium">
              {client.daysCompleted}/{client.daysTotal} days
            </span>
          </div>
          <Progress
            value={(Number.parseInt(client.daysCompleted) / Number.parseInt(client.daysTotal)) * 100}
            className="h-2"
          />
        </div>
      </div>

      {/* Workout Info */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">
            Day {workout.day} - {workout.focus}
          </h3>
          <Badge variant="outline" className="text-xs">
            {completedExercises}/{totalExercises} Complete
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2 mb-3" />

        {workout.clientNote && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Client Note:</p>
            <p className="text-sm text-blue-800">{workout.clientNote}</p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {exercise.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <span className="font-medium">{exercise.name}</span>
                {exercise.isPR && <Trophy className="h-4 w-4 text-yellow-500" />}
              </div>
            </div>

            {exercise.sets && exercise.sets.length > 0 ? (
              <div className="space-y-1">
                {exercise.sets.map((set) => (
                  <div key={set.number} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Set {set.number}</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {set.weight} × {set.reps}
                      </span>
                      {set.isPR && <Trophy className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {exercise.weight && exercise.reps && `${exercise.weight} × ${exercise.reps}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div className="p-4 border-t bg-yellow-50">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">New Personal Records!</span>
          </div>
          <div className="space-y-1">
            {personalRecords.map((pr, index) => (
              <div key={index} className="text-sm text-yellow-700">
                {pr.exercise}: {pr.weight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Buttons */}
      {showInteractionButtons && (
        <div className="p-4 border-t space-y-3">
          {/* Emoji Reactions */}
          <div className="flex flex-wrap gap-2">
            {emojis.map(({ emoji, label }) => (
              <Button
                key={emoji}
                variant={selectedEmoji === emoji ? "default" : "outline"}
                size="sm"
                onClick={() => handleEmojiClick(emoji)}
                className="text-sm"
              >
                {emoji} {label}
              </Button>
            ))}
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            {!showCommentBox ? (
              <Button variant="outline" size="sm" onClick={() => setShowCommentBox(true)} className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Add a comment
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Great work! Keep it up..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCommentSubmit}>
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCommentBox(false)
                      setComment("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mock Data Indicator */}
      {isMockData && (
        <div className="p-2 bg-gray-100 text-center">
          <p className="text-xs text-gray-600">Demo Data - Sign up to see real workouts</p>
        </div>
      )}
    </div>
  )
}

// Default export
export default ClientWorkoutView
