import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Frown } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <Frown className="mb-6 h-24 w-24 text-gray-400" />
      <h1 className="mb-3 text-3xl font-bold text-gray-900">Program Not Found</h1>
      <p className="mb-8 text-gray-600">
        We couldn't find the workout program you're looking for. It might have been deleted or the link is incorrect.
      </p>
      <Link href="/import-programs">
        <Button className="bg-lime-500 hover:bg-lime-600 text-white">Go to Import Programs</Button>
      </Link>
    </div>
  )
}
