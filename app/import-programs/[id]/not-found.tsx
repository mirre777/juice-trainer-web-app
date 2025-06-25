import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">The import program you are looking for does not exist.</p>
      <Link
        href="/import-programs"
        className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Go back to Import Programs
      </Link>
    </div>
  )
}
