"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMutation } from "@tanstack/react-query"
import { sendFeedback } from "@/lib/api/feedback"
import { useToast } from "@/components/ui/use-toast"
import type { AppError } from "@/lib/utils/error-handler"

const FloatingFeedbackButton = () => {
  const [open, setOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const { toast } = useToast()

  const { mutate: submitFeedback, isLoading } = useMutation({
    mutationFn: sendFeedback,
    onSuccess: () => {
      toast({
        title: "Feedback sent!",
        description: "Thank you for your feedback.",
      })
      setOpen(false)
      setFeedbackText("")
    },
    onError: (error: AppError) => {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = () => {
    if (feedbackText.trim() === "") {
      toast({
        title: "Please enter your feedback.",
        variant: "destructive",
      })
      return
    }
    submitFeedback(feedbackText)
  }

  return (
    <>
      <Button className="fixed bottom-4 right-4 z-50" onClick={() => setOpen(true)}>
        Feedback
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>We appreciate your feedback! Please let us know how we can improve.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter your feedback here..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Feedback"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FloatingFeedbackButton
