import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"
import { FinancePageLayout } from "@/components/finance/finance-page-layout"

const FinancePageClient = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Wrap the main content with ComingSoonOverlay */}
      <ComingSoonOverlay message="Finance Dashboard Coming Soon">
        <main className="container mx-auto px-4 py-8">
          <FinancePageLayout isDemo={false} />
        </main>
      </ComingSoonOverlay>
    </div>
  )
}

export default FinancePageClient
