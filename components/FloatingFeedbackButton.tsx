"use client"

import type React from "react"

import { useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { useFeedback } from "@/context/FeedbackContext"

export function FloatingFeedbackButton() {
  const { isOpen, openFeedback, closeFeedback, submitFeedback } = useFeedback()
  const [feedback, setFeedback] = useState("")
  const [type, setType] = useState<"bug" | "feature" | "general">("general")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    try {
      await submitFeedback(feedback, type)
      setFeedback("")
      setType("general")
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={openFeedback}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
          aria-label="Open feedback"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border w-80 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Feedback</h3>
              <button onClick={closeFeedback} className="text-gray-500 hover:text-gray-700" aria-label="Close feedback">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "bug" | "feature" | "general")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingFeedbackButton
