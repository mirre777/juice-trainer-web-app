import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Programs | Juice",
  description: "Import and manage workout programs for your clients",
}

export default function ProgramsPage() {
  // Redirect all /programs traffic to /import-programs
  redirect("/import-programs")
}
