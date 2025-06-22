import SettingsPageClient from "./SettingsPageClient"
import { ProtectedRoute } from "@/components/auth/protected-route"

// Metadata needs to be in a server component
export const metadata = {
  title: "Account Settings",
  description: "Manage your account preferences and settings",
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <SettingsPageClient />
    </ProtectedRoute>
  )
}
