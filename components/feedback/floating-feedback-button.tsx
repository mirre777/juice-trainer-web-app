"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useMutation } from "@tanstack/react-query"
import { createFeedback } from "@/lib/api/feedback"
import { Smile } from "lucide-react"
import type { AppError } from "@/lib/utils/error-handler"

const FloatingFeedbackButton = () => {
  const [open, setOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const { toast } = useToast()

  const { mutate: submitFeedback, isLoading } = useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback.",
      })
      setOpen(false)
      setFeedbackText("")
    },
    onError: (error) => {
      const appError = error as AppError
      toast({
        variant: "destructive",
        title: "Error submitting feedback",
        description: appError.message || "Something went wrong. Please try again.",
      })
    },
  })

  const handleSubmit = () => {
    if (feedbackText.trim() === "") {
      toast({
        variant: "destructive",
        title: "Feedback cannot be empty",
        description: "Please provide some feedback before submitting.",
      })
      return
    }

    submitFeedback({ text: feedbackText })
  }

  return (
    <>
      <Button
        variant="secondary"
        className="fixed bottom-4 right-4 z-50 rounded-full p-2 shadow-lg hover:bg-secondary/80"
        onClick={() => setOpen(true)}
        aria-label="Open feedback form"
      >
        <Smile className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send us feedback</DialogTitle>
            <DialogDescription>Help us improve our service by sharing your thoughts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Tell us what you think..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FloatingFeedbackButton
