"use client"

import { AuthForm } from "@/components/auth/auth-form"

enum SourceType {
  TRAINER_INVITE = "trainer-invite",
  PROGRAM = "program"
}

interface ClientSignupFormProps {
  source: SourceType
  successUrl: string
}

export function ClientSignupForm({ source, successUrl }: ClientSignupFormProps) {
  return (
    <AuthForm
      mode="signup"
      successUrl={successUrl}
      source={source}
    />
  )
}
