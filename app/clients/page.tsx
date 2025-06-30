import type { Metadata } from "next"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ClientPage from "./ClientPage"

export const metadata: Metadata = {
  title: "Clients | Juice",
  description: "Manage your clients and their workout programs",
}

export default function ClientsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ClientPage />
    </ProtectedRoute>
  )
}
