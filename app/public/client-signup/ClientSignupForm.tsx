"use client"

import { AuthForm } from "@/components/auth/auth-form"

enum SourceType {
  TRAINER_INVITE = "trainer-invite",
  PROGRAM = "program"
}

interface ClientSignupFormProps {
  source: SourceType
  successUrl: string
  successCallback: (programId: string) => Promise<void>
  programId: string
}

export function ClientSignupForm({ source, successUrl, successCallback, programId }: ClientSignupFormProps) {
  return (
    <AuthForm
      mode="signup"
      successUrl={successUrl}
      source={source}
      isTrainerSignup={false}
      successCallback={() => successCallback(programId)}
    />
  )
}
