"use client"

import { FinancePageLayout } from "@/components/finance/finance-page-layout"
import { PageLayout } from "@/components/shared/page-layout"

// Mock data is handled within the FinancePageLayout component
export default function DemoFinancePage() {
  return (
    <PageLayout>
      <FinancePageLayout isDemo={true} />
    </PageLayout>
  )
}
