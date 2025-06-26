"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function FloatingFeedbackButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState("")

  // Don't show on auth pages, landing page, or invite pages
  if (pathname === "/login" || pathname === "/signup" || pathname === "/" || pathname.startsWith("/invite/")) {
    return null
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ feedback, pathname }),
      })

      if (!res.ok) {
        toast.error("Something went wrong. Please try again.")
        return
      }

      setOpen(false)
      setFeedback("")
      toast.success("Thank you for your feedback!")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>Let us know how we can improve. Your feedback is valuable to us.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your feedback here."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <Button type="submit" onClick={handleSubmit}>
            Submit Feedback
          </Button>
        </DialogContent>
      </Dialog>

      <Button variant="secondary" className="fixed bottom-4 right-4 rounded-full" onClick={() => setOpen(true)}>
        Feedback
      </Button>
    </>
  )
}
