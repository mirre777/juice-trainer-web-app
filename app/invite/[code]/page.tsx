import type { Metadata } from "next"
import InviteClientPage from "./InviteClientPage"

interface InvitePageProps {
  params: {
    code: string
  }
  searchParams: {
    tn?: string
  }
}

export async function generateMetadata({ params, searchParams }: InvitePageProps): Promise<Metadata> {
  const trainerName = searchParams.tn ? decodeURIComponent(searchParams.tn) : "your trainer"
  const code = params.code || "unknown"

  console.log(`[InvitePage:generateMetadata] Code from params: ${code}`)

  return {
    title: `Join ${trainerName}'s Program | Juice Fitness`,
    description: `Accept your invitation to join ${trainerName}'s coaching program on Juice Fitness`,
  }
}

export default function InvitePage({ params, searchParams }: InvitePageProps) {
  // Log the params to debug
  console.log(`[InvitePage] Rendering with params:`, JSON.stringify(params))

  // Ensure code is properly passed
  const code = params.code
  console.log(`[InvitePage] Code extracted: ${code}`)

  return <InviteClientPage code={code} trainerName={searchParams.tn} />
}
