"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { processInvitation } from "@/lib/firebase/client-service"
import { useToast } from "@/hooks/use-toast"

export default function InviteAppPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get the invite code from the URL
    const code = searchParams.get("code")
    if (code) {
      setInviteCode(code)
    } else {
      setError("No invitation code provided")
    }

    // Check if user is logged in
    const currentUserId =
      localStorage.getItem("user_id") ||
      sessionStorage.getItem("user_id") ||
      document.cookie.replace(/(?:(?:^|.*;\s*)user_id\s*=\s*([^;]*).*$)|^.*$/, "$1")

    if (currentUserId) {
      setUserId(currentUserId)
    }

    setLoading(false)
  }, [searchParams])

  const handleProcessInvitation = async () => {
    if (!inviteCode || !userId) {
      setError("Missing invitation code or user ID")
      return
    }

    setLoading(true)

    try {
      const result = await processInvitation(inviteCode, userId)

      if (result.success) {
        toast({
          title: "Success!",
          description: "You've been connected with your trainer.",
          variant: "default",
        })

        // Redirect to overview page
        router.push("/overview")
      } else {
        setError("Invalid or expired invitation code")
      }
    } catch (err) {
      console.error("Error processing invitation:", err)
      setError("Failed to process invitation")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-4 text-center">
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="animate-pulse h-4 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-center mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Invitation Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-center mb-4">Sign In Required</h2>
          <p className="text-gray-600 text-center mb-6">
            Please sign in to connect with your trainer using invitation code: <strong>{inviteCode}</strong>
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push(`/login?invite=${inviteCode}`)} className="w-full">
              Sign In
            </Button>
            <Button onClick={() => router.push(`/signup?invite=${inviteCode}`)} variant="outline" className="w-full">
              Create Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-center mb-4">Connect with Trainer</h2>
        <p className="text-gray-600 text-center mb-6">
          You're about to connect with your trainer using invitation code: <strong>{inviteCode}</strong>
        </p>
        <div className="space-y-3">
          <Button onClick={handleProcessInvitation} className="w-full bg-lime-400 text-black hover:bg-lime-500">
            Connect Now
          </Button>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
