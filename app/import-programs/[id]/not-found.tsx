import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Program Not Found</h2>
        <p className="text-gray-500 mb-8">The program you're looking for doesn't exist or has been removed.</p>
        <Link href="/import-programs">
          <Button>Back to Import Programs</Button>
        </Link>
      </div>
    </div>
  )
}
