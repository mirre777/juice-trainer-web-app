import SessionsClientPage from "./SessionsClientPage"

// Metadata needs to be in a server component
export const metadata = {
  title: "Sessions Calendar",
  description: "Manage your client sessions and appointments",
}

export default function SessionsPage() {
  return <SessionsClientPage />
}
