import { Loader2 } from "lucide-react"

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-lime-500" />
      <p className="text-gray-600">Loading...</p>
    </div>
  )
}
