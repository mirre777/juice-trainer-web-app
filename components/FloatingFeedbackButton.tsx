"use client"

import { useState } from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFeedback } from "@/context/FeedbackContext"

export default function FloatingFeedbackButton() {
  const { isOpen, openFeedback, closeFeedback, submitFeedback } = useFeedback()
  const [feedback, setFeedback] = useState("")
  const [type, setType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim() || !type) return

    setIsSubmitting(true)
    try {
      await submitFeedback(feedback, type)
      setFeedback("")
      setType("")
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        onClick={openFeedback}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={closeFeedback}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeFeedback}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!feedback.trim() || !type || isSubmitting}>
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
