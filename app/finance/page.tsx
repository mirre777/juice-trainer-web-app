import type { Metadata } from "next"
import FinancePageClient from "./FinancePageClient"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Finance | Juice",
  description: "Manage your coaching business finances",
}

export default function FinancePage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <FinancePageClient />
    </ProtectedRoute>
  )
}
