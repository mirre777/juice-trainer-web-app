"use client"

import { ClientsPageLayout } from "@/components/clients-page-layout"
import { PageLayout } from "@/components/shared/page-layout"

export default function DemoClientsPage() {
  return (
    <PageLayout>
      <ClientsPageLayout isDemo={true} />
    </PageLayout>
  )
}
