"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setCookie } from "cookies-next"
import { storeInvitationCode } from "@/lib/firebase/user-service"

interface AuthFormProps {
  mode: "login" | "signup"
  invitationCode?: string
  trainerName?: string
  isTrainerSignup?: boolean
}

export function AuthForm({ mode, invitationCode = "", trainerName = "", isTrainerSignup = false }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showInviteInfo, setShowInviteInfo] = useState(!!invitationCode)

  useEffect(() => {
    setShowInviteInfo(!!invitationCode)
  }, [invitationCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log(
        `[AuthForm] Submitting ${mode} form with invitation code: ${invitationCode}, isTrainerSignup: ${isTrainerSignup}`,
      )

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: mode === "signup" ? name : undefined,
          invitationCode: invitationCode || undefined,
          isTrainerSignup: mode === "signup" ? isTrainerSignup : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`[AuthForm] ${mode} failed:`, data)
        setError(data.error || `Failed to ${mode}. Please try again.`)
        setLoading(false)
        return
      }

      console.log(`[AuthForm] ${mode} successful:`, data)

      if (data.userId) {
        setCookie("user_id", data.userId)
        localStorage.setItem("user_id", data.userId)

        if (invitationCode && mode === "signup") {
          console.log(`[AuthForm] Storing invitation code ${invitationCode} for user ${data.userId}`)
          await storeInvitationCode(data.userId, invitationCode)
        }
      }

      if (data.token) {
        setCookie("auth_token", data.token)
        console.log("[AuthForm] Auth token set in cookies")
      } else {
        console.log("[AuthForm] No auth token received from server")
      }

      if (mode === "signup") {
        if (invitationCode) {
          console.log(`[AuthForm] Redirecting to download page after signup with invitation`)
          window.location.href = "https://juice.fitness/download-juice-app"
        } else if (isTrainerSignup) {
          if (data.autoSignedIn) {
            console.log(`[AuthForm] Trainer auto-signed in, redirecting to overview`)
            router.push("/overview")
          } else {
            console.log(`[AuthForm] Trainer account created but auto-signin failed, redirecting to login`)
            router.push("/login?message=Account created successfully. Please log in.")
          }
        } else {
          console.log(`[AuthForm] Redirecting to download page after mobile app signup`)
          window.location.href = "https://juice.fitness/download-juice-app"
        }
      } else if (mode === "login") {
        console.log(`[AuthForm] Successful login, checking user role`)

        try {
          await new Promise((resolve) => setTimeout(resolve, 100))

          const userResponse = await fetch("/api/auth/me", {
            credentials: "include",
          })
          const userData = await userResponse.json()

          console.log(`[AuthForm] 🔍 DETAILED User data response:`, {
            fullResponse: userData,
            responseKeys: Object.keys(userData),
            hasUser: !!userData.user,
            userKeys: userData.user ? Object.keys(userData.user) : "no user property",
            directRole: userData.role,
            nestedRole: userData.user?.role,
            responseStatus: userResponse.status,
            responseOk: userResponse.ok,
          })

          if (!userResponse.ok) {
            console.error("[AuthForm] Failed to get user data:", userData)
            router.push("/mobile-app-success")
            return
          }

          // FIX: Handle both nested and flat response formats
          const userRole = userData.user?.role || userData.role
          console.log(`[AuthForm] 🎯 Extracted user role: "${userRole}" (type: ${typeof userRole})`)
          console.log(`[AuthForm] 🔍 Role extraction details:`, {
            "userData.user?.role": userData.user?.role,
            "userData.role": userData.role,
            "final userRole": userRole,
          })

          if (userRole === "trainer") {
            console.log(`[AuthForm] ✅ User is trainer, redirecting to overview`)
            router.push("/overview")
          } else {
            console.log(`[AuthForm] ❌ User is not trainer (role: ${userRole}), redirecting to mobile app success`)
            router.push("/mobile-app-success")
          }
        } catch (userError) {
          console.error("[AuthForm] Error fetching user data:", userError)
          router.push("/mobile-app-success")
        }
      }
    } catch (err) {
      console.error(`[AuthForm] Error during ${mode}:`, err)
      setError(`An unexpected error occurred. Please try again.`)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Create an account"}</h1>
        <p className="text-gray-500 text-sm">
          {mode === "login"
            ? "Enter your email below to login to your account"
            : "Enter your information below to create your account"}
        </p>
      </div>

      {showInviteInfo && invitationCode && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <p className="text-green-800 font-medium text-sm">
            {trainerName ? `You've been invited by ${trainerName}!` : "You've been invited to join Juice!"}
          </p>
          <p className="text-green-700 text-sm mt-1">
            {mode === "login"
              ? "Log in to connect with your trainer."
              : "Create an account to connect with your trainer."}
          </p>
          <p className="text-xs text-green-600 mt-2">Invitation code: {invitationCode}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Processing..." : mode === "login" ? "Login" : "Create account"}
        </Button>
      </form>
      <div className="text-center text-sm">
        {mode === "login" ? (
          <p>
            Don't have an account?{" "}
            <Link
              href={
                invitationCode
                  ? `/signup?code=${invitationCode}${trainerName ? `&tn=${encodeURIComponent(trainerName)}` : ""}`
                  : "/signup"
              }
              className="text-blue-600 hover:text-blue-800"
            >
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link
              href={
                invitationCode
                  ? `/login?code=${invitationCode}${trainerName ? `&tn=${encodeURIComponent(trainerName)}` : ""}`
                  : "/login"
              }
              className="text-blue-600 hover:text-blue-800"
            >
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
