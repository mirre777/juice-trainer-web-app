import Link from "next/link"
import type { AppError } from "@/lib/utils/error-handler"

export default function NotFound({ error }: { error: AppError }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold text-gray-800">404 - Not Found</h1>
      <p className="text-gray-600 mt-4">Could not find the import program with the specified ID.</p>
      <Link
        href="/import-programs"
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
      >
        Back to Import Programs
      </Link>
    </div>
  )
}
