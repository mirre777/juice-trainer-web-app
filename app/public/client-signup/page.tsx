import { Metadata } from "next"
import Image from "next/image"
import { ClientSignupForm } from "./ClientSignupForm"
import { importProgram, acceptInvite } from "./actions"

enum SourceType {
    TRAINER_INVITE = "trainer-invite",
    PROGRAM = "program"
}

interface ClientSignupProps {
    params: Promise<{}>
    searchParams: Promise<{ source: string, programId?: string, inviteCode?: string }>
}

export async function generateMetadata({ searchParams }: ClientSignupProps): Promise<Metadata> {
  const { source } = await searchParams
  const sourceType = source === "program" ? SourceType.PROGRAM : SourceType.TRAINER_INVITE
  console.log("source", sourceType)
  const description = sourceType === SourceType.PROGRAM ? "Sign up for a program" : "Sign up for a trainer invite"

  return {
    title: `Client Signup | Juice`,
    description: description,
  }
}

export default async function ClientSignupPage({ searchParams }: ClientSignupProps) {
  const { source, programId, inviteCode } = await searchParams
  const sourceType = source === "program" ? SourceType.PROGRAM : SourceType.TRAINER_INVITE
  console.log("source", sourceType)
  const successUrl = sourceType === SourceType.PROGRAM? `/public/program-import-celebration` : "https://juice.fitness/download-juice-app"

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Juice Logo */}
        <div className="text-center mb-8">
          <Image src="/images/logo.svg" alt="Juice Logo" width={66} height={100} />
          <h1 className="text-xl font-medium text-gray-900">juice</h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          {sourceType === SourceType.PROGRAM ? (
            <ClientSignupForm
              source={SourceType.PROGRAM}
              successUrl={successUrl}
              programId={programId!}
            />
          ) : (
            <ClientSignupForm
              source={SourceType.TRAINER_INVITE}
              successUrl={successUrl}
              inviteCode={inviteCode!}
            />
          )}
        </div>
      </div>
    </>
  )
}