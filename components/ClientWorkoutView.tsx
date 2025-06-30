"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, Circle, Trophy, MessageCircle, Heart, ThumbsUp, FlameIcon as Fire } from "lucide-react"

interface Exercise {
  id: string
  name: string
  weight: string
  reps: string
  completed: boolean
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
  clientNote: string
}

interface ClientWorkoutViewProps {
  client: Client
  workout: Workout
  exercises: Exercise[]
  personalRecords?: string[]
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
  exercises,
  personalRecords = [],
  onEmojiSelect,
  onComment,
  showInteractionButtons = true,
  isMockData = false,
}: ClientWorkoutViewProps) {
  const [comment, setComment] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)

  const completedExercises = exercises.filter((ex) => ex.completed).length
  const progressPercentage = (completedExercises / exercises.length) * 100

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(emoji)
    onEmojiSelect?.(emoji)
  }

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      onComment?.(comment)
      setComment("")
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
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
            <h3 className="font-semibold text-lg">{client.name}</h3>
            <p className="text-sm text-gray-500">{client.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Program Progress</p>
            <p className="font-medium">
              Week {client.programWeek} of {client.programTotal}
            </p>
          </div>
          <div>
            <p className="text-gray-500">This Week</p>
            <p className="font-medium">
              {client.daysCompleted}/{client.daysTotal} days
            </p>
          </div>
        </div>
      </div>

      {/* Workout Info */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">
            Day {workout.day} - {workout.focus}
          </h4>
          <Badge variant="secondary">
            {completedExercises}/{exercises.length} done
          </Badge>
        </div>
        <Progress value={progressPercentage} className="mb-3" />

        {workout.clientNote && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Client Note:</p>
            <p className="text-sm text-blue-800">{workout.clientNote}</p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="p-4 space-y-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="border-l-4 border-l-green-500">
            <CardContent className="p-3">
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

              {exercise.sets ? (
                <div className="space-y-1">
                  {exercise.sets.map((set) => (
                    <div key={set.number} className="flex items-center justify-between text-sm">
                      <span>Set {set.number}</span>
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
                  {exercise.weight} × {exercise.reps}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div className="p-4 border-t">
          <h5 className="font-semibold mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Personal Records
          </h5>
          <div className="space-y-1">
            {personalRecords.map((record, index) => (
              <p key={index} className="text-sm text-gray-600">
                {record}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Buttons */}
      {showInteractionButtons && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <Button
                variant={selectedEmoji === "❤️" ? "default" : "outline"}
                size="sm"
                onClick={() => handleEmojiClick("❤️")}
              >
                <Heart className="h-4 w-4 mr-1" />
                ❤️
              </Button>
              <Button
                variant={selectedEmoji === "👍" ? "default" : "outline"}
                size="sm"
                onClick={() => handleEmojiClick("👍")}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />👍
              </Button>
              <Button
                variant={selectedEmoji === "🔥" ? "default" : "outline"}
                size="sm"
                onClick={() => handleEmojiClick("🔥")}
              >
                <Fire className="h-4 w-4 mr-1" />🔥
              </Button>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Comment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Great work! Keep it up..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setComment("")}>
                      Cancel
                    </Button>
                    <Button onClick={handleCommentSubmit}>Send Comment</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {isMockData && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">This is demo data. Sign up to create real workouts!</p>
        </div>
      )}
    </div>
  )
}

export default ClientWorkoutView
