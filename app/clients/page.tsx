import type { Metadata } from "next"
import ClientPage from "./ClientPage"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Clients | Juice",
  description: "Manage your coaching clients",
}

export default function ClientsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ClientPage />
    </ProtectedRoute>
  )
}
