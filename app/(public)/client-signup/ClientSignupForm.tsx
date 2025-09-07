"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { importProgram, acceptInvite } from "./actions"

enum SourceType {
  TRAINER_INVITE = "trainer-invite",
  PROGRAM = "program"
}

interface ProgramClientSignUpProps {
  source: SourceType.PROGRAM
  successUrl: string
  programId: string
}

interface TrainerClientSignUpProps {
  source: SourceType.TRAINER_INVITE
  successUrl: string
  inviteCode: string
}

type ClientSignupFormProps = ProgramClientSignUpProps | TrainerClientSignUpProps

export function ClientSignupForm(props: ClientSignupFormProps) {
  const successCallback = async () => {
    try {
      if (props.source === SourceType.PROGRAM) {
        await importProgram(props.programId)
      } else if (props.source === SourceType.TRAINER_INVITE) {
        await acceptInvite(props.inviteCode)
      }
    } catch (error) {
      console.error("Error in success callback:", error)
      // You might want to show an error message to the user here
    } finally {
      await clearStorage();
    }
  }

  const clearStorage = async () => {
    localStorage.clear()
    sessionStorage.clear()
  }

  return (
    <AuthForm
      mode="signup"
      successUrl={props.successUrl}
      source={props.source}
      isTrainerSignup={false}
      successCallback={successCallback}
    />
  )
}
