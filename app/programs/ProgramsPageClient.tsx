"use client"

import { ProgramsPageLayout } from "@/components/programs/programs-page-layout"

export default function ProgramsPageClient() {
  return (
    <main className="container mx-auto px-4 py-8">
      <ProgramsPageLayout isDemo={false} />
    </main>
  )
}
