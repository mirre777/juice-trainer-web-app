"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCookie } from "cookies-next"

export default function SetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID from cookie or URL params
    const userIdFromCookie = getCookie("user_id") as string
    const userIdFromParams = searchParams.get("userId")

    const currentUserId = userIdFromParams || userIdFromCookie

    if (!currentUserId) {
      router.push("/login")
      return
    }

    setUserId(currentUserId)
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!userId) {
      setError("User ID not found. Please log in again.")
      setLoading(false)
      return
    }

    try {
      console.log(`[SetPassword] Setting password for user: ${userId}`)

      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`[SetPassword] Failed:`, data)
        setError(data.error || "Failed to set password. Please try again.")
        setLoading(false)
        return
      }

      console.log(`[SetPassword] Success:`, data)

      // Redirect to dashboard or overview
      router.push("/demo/overview")
    } catch (err) {
      console.error(`[SetPassword] Error:`, err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Set Up Your Password</CardTitle>
          <CardDescription>
            Enhance your account security by setting up a password. This will enable secure login for future sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              After setting your password, you'll be able to log in securely with your email and password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
