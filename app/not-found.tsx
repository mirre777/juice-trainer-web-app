import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
      <div className="text-center w-full max-w-4xl px-4">
        <div className="mb-12 relative w-64 h-64 mx-auto">
          {/* Using a simpler image approach */}
          <div className="w-full h-full rounded-full bg-yellow-100 border-8 border-yellow-200 flex items-center justify-center">
            <span className="text-6xl">🍋</span>
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-6 text-gray-800">Whoops! Page Not Found</h1>
        <p className="mb-10 text-xl text-gray-600 max-w-2xl mx-auto">
          Looks like this page decided to squeeze out of existence! Our lemon friend is just as confused as you are.
        </p>

        <Link href="/overview">
          <Button className="bg-[#CCFF00] text-black hover:bg-[#b8e600] px-8 py-6 text-lg">
            <Home className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
