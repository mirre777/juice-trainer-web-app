import type { Metadata } from "next"
import ClientPage from "./ClientPage"

export const metadata: Metadata = {
  title: "Clients | Juice",
  description: "Manage your coaching clients",
}

export default function ClientsPage() {
  return <ClientPage />
}
