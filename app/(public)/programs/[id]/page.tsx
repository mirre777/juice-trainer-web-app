import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProgramDetails } from "./ProgramDetails"

interface ProgramPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: `Program ${id} | Juice`,
    description: "View workout program details",
  }
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return <ProgramDetails programId={id} />
}
