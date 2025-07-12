import type { Metadata } from "next"
import OverviewPageClient from "./OverviewPageClient"

export const metadata: Metadata = {
  title: "Dashboard | Juice",
  description: "Your coaching business at a glance",
}

export default function OverviewPage() {
  return <OverviewPageClient />
}
