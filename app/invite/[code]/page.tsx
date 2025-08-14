import type { Metadata } from "next"
import InviteClientPage from "./InviteClientPage"

interface InvitePageProps {
  params: Promise<{
    code: string
  }>
  searchParams: Promise<{
    tn?: string
  }>
}

export async function generateMetadata({ params, searchParams }: InvitePageProps): Promise<Metadata> {
  const { code } = await params
  const { tn } = await searchParams
  const trainerName = tn ? decodeURIComponent(tn) : "your trainer"

  console.log(`[InvitePage:generateMetadata] Code from params: ${code}`)

  return {
    title: `Join ${trainerName}'s Program | Juice Fitness`,
    description: `Accept your invitation to join ${trainerName}'s coaching program on Juice Fitness`,
  }
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  // Await params and searchParams
  const { code } = await params
  const { tn } = await searchParams

  // Log the params to debug
  console.log(`[InvitePage] Rendering with code: ${code}, trainerName: ${tn}`)

  return <InviteClientPage code={code} trainerName={tn} />
}
