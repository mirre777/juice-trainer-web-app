"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Icons } from "../icons"
import { sendFeedback } from "@/lib/api/feedback"
import type { AppError } from "@/lib/utils/error-handler"

interface FeedbackModalProps {
  className?: string
}

export function FeedbackModal({ className }: FeedbackModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { mutate: submitFeedback } = useMutation({
    mutationFn: async () => {
      setIsLoading(true)
      try {
        await sendFeedback({ email, feedback })
        toast({
          title: "Feedback sent!",
          description: "Thank you for your feedback.",
        })
        setOpen(false)
        setEmail("")
        setFeedback("")
      } catch (error: any) {
        const appError = error as AppError
        toast({
          title: "Something went wrong.",
          description: appError.message || "Failed to send feedback.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={cn(className)}>
          Feedback
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send us your feedback</AlertDialogTitle>
          <AlertDialogDescription>
            We appreciate your feedback. Please let us know how we can improve.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              type="email"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feedback" className="text-right">
              Feedback
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => submitFeedback()} disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
