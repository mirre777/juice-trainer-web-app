import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TrainerInviteDetails } from "./TrainerInviteDetails"

interface TrainerInvitePageProps {
  params: Promise<{ inviteCode: string }>
}

export async function generateMetadata({ params }: TrainerInvitePageProps): Promise<Metadata> {
  const { inviteCode } = await params

  return {
    title: `Trainer Invite ${inviteCode} | Juice`,
    description: "View trainer invite details",
  }
}

export default async function TrainerInvitePage({ params }: TrainerInvitePageProps) {
  const { inviteCode } = await params

  if (!inviteCode) {
    notFound()
  }

  return <TrainerInviteDetails inviteCode={inviteCode} />
}
