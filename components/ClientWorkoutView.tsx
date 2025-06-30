"use client"

import type React from "react"
import { useState } from "react"
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase/firebase"
import { Button } from "./ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/context/AuthContext"
import { Card } from "./ui/card"

interface ClientWorkoutViewProps {
  workout: any
  userId: string
  clientId?: string
  client?: any
  isMockData?: boolean
}

const ClientWorkoutView: React.FC<ClientWorkoutViewProps> = ({
  workout,
  userId,
  clientId,
  client,
  isMockData = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comment, setComment] = useState("")
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuthContext()

  // Add defensive checks at the beginning
  if (!workout) {
    console.warn("ClientWorkoutView: workout prop is undefined or null")
    return <div className="p-4 text-center">No workout data available</div>
  }

  const saveReaction = async (emoji: string) => {
    try {
      // 🔍 ENHANCED DEBUG LOGGING TO FIND THE SOURCE
      console.log("=== REACTION DEBUG INFO ===")
      console.log("🔥 PROPS ANALYSIS:")
      console.log("- userId prop:", userId)
      console.log("- clientId prop:", clientId)
      console.log("- client prop:", client)
      console.log("- workout prop:", workout)
      console.log("")
      console.log("🔥 WORKOUT ANALYSIS:")
      console.log("- workout.id:", workout?.id)
      console.log("- workout.userId:", workout?.userId) // Check if workout has userId
      console.log("- workout.clientId:", workout?.clientId) // Check if workout has clientId
      console.log("- workout.ownerId:", workout?.ownerId) // Check if workout has ownerId
      console.log("")
      console.log("🔥 CLIENT ANALYSIS:")
      console.log("- client?.id:", client?.id)
      console.log("- client?.userId:", client?.userId) // Check if client has userId
      console.log("- client?.firebaseUid:", client?.firebaseUid) // Check if client has firebaseUid
      console.log("")

      // 🎯 TRY MULTIPLE STRATEGIES TO GET THE CORRECT USER ID
      let actualUserId = null

      // Strategy 1: Use workout's owner information
      if (workout?.userId) {
        actualUserId = workout.userId
        console.log("✅ Using workout.userId:", actualUserId)
      }
      // Strategy 2: Use workout's clientId if it exists
      else if (workout?.clientId) {
        actualUserId = workout.clientId
        console.log("✅ Using workout.clientId:", actualUserId)
      }
      // Strategy 3: Use client's userId if available
      else if (client?.userId) {
        actualUserId = client.userId
        console.log("✅ Using client.userId:", actualUserId)
      }
      // Strategy 4: Use client's firebaseUid if available
      else if (client?.firebaseUid) {
        actualUserId = client.firebaseUid
        console.log("✅ Using client.firebaseUid:", actualUserId)
      }
      // Strategy 5: Fall back to props
      else {
        actualUserId = userId || clientId || client?.id
        console.log("⚠️ Using fallback:", actualUserId)
      }

      console.log("")
      console.log("🎯 FINAL DECISION:")
      console.log("- Selected userId:", actualUserId)
      console.log("- Workout ID:", workout?.id)
      console.log("- Full path:", `users/${actualUserId}/workouts/${workout?.id}`)
      console.log("========================")

      if (!workout?.id || !actualUserId) {
        console.error("❌ Missing required data:", {
          workoutId: workout?.id,
          actualUserId,
        })
        toast({
          title: "Error saving reaction",
          description: "Missing workout or user information",
          variant: "destructive",
        })
        return
      }

      if (isMockData) {
        console.log("🎭 Mock data - not saving to database")
        toast({
          title: "Reaction saved (demo)",
          description: "This is demo mode, reaction not saved to database",
        })
        return
      }

      // 🔍 LOG THE EXACT PATH BEING USED
      const documentPath = `users/${actualUserId}/workouts/${workout.id}`
      console.log("🔥 Attempting to save reaction to path:", documentPath)

      const workoutRef = doc(db, documentPath)

      await updateDoc(workoutRef, {
        reactions: arrayUnion({
          emoji,
          trainerId: userId, // Keep original userId as trainerId (the trainer reacting)
          timestamp: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
      })

      console.log("✅ Reaction saved successfully!")
      toast({
        title: "Reaction saved",
        description: "Your reaction has been saved",
      })
    } catch (error) {
      console.error("❌ Error saving reaction:", error)
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      })
      toast({
        title: "Error saving reaction",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  const saveComment = async () => {
    try {
      // Apply the same logic for comments
      let actualUserId = null

      if (workout?.userId) {
        actualUserId = workout.userId
      } else if (workout?.clientId) {
        actualUserId = workout.clientId
      } else if (client?.userId) {
        actualUserId = client.userId
      } else if (client?.firebaseUid) {
        actualUserId = client.firebaseUid
      } else {
        actualUserId = userId || clientId || client?.id
      }

      if (!comment.trim()) return

      console.log("=== COMMENT DEBUG INFO ===")
      console.log("Comment:", comment)
      console.log("actualUserId:", actualUserId)
      console.log("workout.id:", workout?.id)
      console.log("Full path:", `users/${actualUserId}/workouts/${workout?.id}`)
      console.log("========================")

      if (!workout?.id || !actualUserId) {
        console.error("❌ Missing required data for comment:", {
          workoutId: workout?.id,
          actualUserId,
        })
        toast({
          title: "Error saving comment",
          description: "Missing workout or user information",
          variant: "destructive",
        })
        return
      }

      if (isMockData) {
        console.log("🎭 Mock data - not saving comment to database")
        toast({
          title: "Comment saved (demo)",
          description: "This is demo mode, comment not saved to database",
        })
        setComment("")
        setShowCommentInput(false)
        return
      }

      const workoutRef = doc(db, `users/${actualUserId}/workouts/${workout.id}`)

      await updateDoc(workoutRef, {
        comments: arrayUnion({
          comment,
          trainerId: userId, // Keep original userId as trainerId
          timestamp: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
      })

      console.log("✅ Comment saved successfully!")
      toast({
        title: "Comment saved",
        description: "Your comment has been saved",
      })

      setComment("")
      setShowCommentInput(false)
    } catch (error) {
      console.error("❌ Error saving comment:", error)
      toast({
        title: "Error saving comment",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="relative">
      {/* Workout content would go here */}
      {workout.notes && workout.notes.trim() !== "" && (
        <Card className="mb-6 p-4 border-2 border-primary bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Client Note:</h3>
          <p className="text-sm text-gray-700">{workout.notes}</p>
        </Card>
      )}

      {isAuthenticated && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center gap-4 z-50">
          <Button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded-full w-12 h-12 bg-white shadow-lg flex items-center justify-center hover:bg-gray-100"
          >
            <span className="text-xl">😊</span>
          </Button>

          <Button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="rounded-full w-12 h-12 bg-white shadow-lg flex items-center justify-center hover:bg-gray-100"
          >
            <span className="text-xl">💬</span>
          </Button>
        </div>
      )}

      {isAuthenticated && showEmojiPicker && (
        <div className="fixed bottom-36 left-0 right-0 flex justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 flex gap-2">
            {["👍", "👏", "🔥", "💪", "👊", "🎉"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  saveReaction(emoji)
                  setShowEmojiPicker(false)
                }}
                className="text-2xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && showCommentInput && (
        <div className="fixed bottom-36 left-0 right-0 flex justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md mx-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end mt-2">
              <Button onClick={() => setShowCommentInput(false)} variant="outline" className="mr-2">
                Cancel
              </Button>
              <Button onClick={saveComment}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export as default to fix the deployment error
export default ClientWorkoutView
