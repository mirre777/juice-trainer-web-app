"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitFeedback } from "@/lib/firebase/feedback-service"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentPage?: string
}

type Sentiment = "sad" | "neutral" | "happy"

export function FeedbackModal({ isOpen, onClose, userId, currentPage }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("")
  const [sentiment, setSentiment] = useState<Sentiment | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        handleClose()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitFeedback(userId, {
        feedback: feedback.trim(),
        sentiment,
        app: "web app",
        page: currentPage,
        userAgent: navigator.userAgent,
      })

      if (result.success) {
        setShowSuccess(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFeedback("")
    setSentiment(undefined)
    setIsSubmitting(false)
    setShowSuccess(false)
    onClose()
  }

  const getSentimentEmoji = (type: Sentiment) => {
    switch (type) {
      case "sad":
        return <Image src="/images/sad-strawberry.png" alt="Sad" width={64} height={64} className="w-16 h-16" />
      case "neutral":
        return <Image src="/images/arnold-lemon-neutral.png" alt="Neutral" width={64} height={64} className="w-16 h-16" />
      case "happy":
        return <Image src="/images/arnold-apple-happy.png" alt="Happy" width={64} height={64} className="w-16 h-16" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          // Success State
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center">Thank You!</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-4 py-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Feedback Submitted Successfully</p>
                <p className="text-gray-600">We appreciate your input and will use it to improve your experience.</p>
              </div>
              <p className="text-sm text-gray-500">This modal will close automatically in 3 seconds</p>
            </div>
          </>
        ) : (
          // Feedback Form State
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">The good, the bad and the ugly</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-gray-600">We would love to know what you think. For real. Don't spare our feelings.</p>

              <Textarea
                placeholder="What would Arnold say?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={1000}
              />

              <div className="flex gap-4 justify-center">
                {(["sad", "neutral", "happy"] as Sentiment[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSentiment(sentiment === type ? undefined : type)}
                    className={`w-24 h-24 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      sentiment === type ? "border-lime-500 bg-lime-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {getSentimentEmoji(type)}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-8">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !feedback.trim()}
                  variant="default"
                  style={{ backgroundColor: "#000000", color: "#ffffff" }}
                  className="!bg-black !text-white hover:!bg-gray-800"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
