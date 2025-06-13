"use client"

import type React from "react"

import { FloatingFeedbackButton } from "./floating-feedback-button"

interface FeedbackProviderProps {
  children: React.ReactNode
  userId?: string
}

export function FeedbackProvider({ children, userId }: FeedbackProviderProps) {
  return (
    <>
      {children}
      <FloatingFeedbackButton userId={userId} />
    </>
  )
}
