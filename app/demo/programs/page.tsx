import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Programs | Juice Demo",
  description: "Import and manage workout programs for your clients",
}

export default function DemoProgramsPage() {
  // Redirect all /demo/programs traffic to /demo/import-programs
  redirect("/demo/import-programs")
}
