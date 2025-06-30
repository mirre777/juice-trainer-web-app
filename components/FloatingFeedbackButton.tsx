"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send } from "lucide-react"
import { useFeedback } from "@/context/FeedbackContext"

export function FloatingFeedbackButton() {
  const { isOpen, openFeedback, closeFeedback, submitFeedback, isSubmitting } = useFeedback()
  const [formData, setFormData] = useState({
    type: "general" as "bug" | "feature" | "general",
    message: "",
    email: "",
    rating: 5,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.message.trim()) return

    try {
      await submitFeedback(formData)
      // Reset form
      setFormData({
        type: "general",
        message: "",
        email: "",
        rating: 5,
      })
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={openFeedback}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Feedback Modal */}
      <Dialog open={isOpen} onOpenChange={closeFeedback}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Feedback Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "bug" | "feature" | "general") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeFeedback}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.message.trim()}>
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FloatingFeedbackButton
