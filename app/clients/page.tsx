import type { Metadata } from "next"
import { ClientsPageLayout } from "@/components/clients-page-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Clients | Juice",
  description: "Manage your coaching clients",
}

export default function ClientsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ClientsPageLayout />
    </ProtectedRoute>
  )
}
