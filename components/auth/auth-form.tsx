"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setCookie } from "cookies-next"
import { storeInviteCode } from "@/lib/firebase/user-service"
import { config } from "@/lib/config"

interface AuthFormProps {
  mode: "login" | "signup"
  inviteCode?: string
  trainerName?: string
  isTrainerSignup?: boolean
}

export function AuthForm({ mode, inviteCode = "", trainerName = "", isTrainerSignup = false }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showInviteInfo, setShowInviteInfo] = useState(!!inviteCode)

  useEffect(() => {
    // Update showInviteInfo if inviteCode changes
    setShowInviteInfo(!!inviteCode)
  }, [inviteCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log(
        `[AuthForm] Submitting ${mode} form with invitation code: ${inviteCode}, isTrainerSignup: ${isTrainerSignup}`,
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
          inviteCode: inviteCode || undefined,
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

      // Set cookies and local storage
      if (data.userId) {
        setCookie("user_id", data.userId)
        localStorage.setItem("user_id", data.userId)

        // If we have an invitation code, store it in the user document
        if (inviteCode && mode === "signup") {
          console.log(`[AuthForm] Storing invitation code ${inviteCode} for user ${data.userId}`)
          await storeInviteCode(data.userId, inviteCode)
        }
      }

      // Set auth token cookie from the response (for login or auto-signed-in signup)
      if (data.token) {
        setCookie("auth_token", data.token)
        console.log("[AuthForm] Auth token set in cookies")
      } else {
        console.log("[AuthForm] No auth token received from server")
      }

      // Handle different response scenarios
      if (mode === "signup") {
        if (inviteCode) {
          // If coming from an invitation signup, redirect to the download page
          console.log(`[AuthForm] Redirecting to download page after signup with invitation`)
          window.location.href = "https://juice.fitness/download-juice-app"
        } else if (isTrainerSignup) {
          // Trainer signup
          if (data.autoSignedIn) {
            // Successfully auto-signed in, redirect to overview
            console.log(`[AuthForm] Trainer auto-signed in, redirecting to overview`)
            router.push("/overview")
          } else {
            // Account created but auto-signin failed, redirect to login
            console.log(`[AuthForm] Trainer account created but auto-signin failed, redirecting to login`)
            router.push("/login?message=Account created successfully. Please log in.")
          }
        } else {
          // Mobile app signup (no trainer role) - redirect to download
          console.log(`[AuthForm] Redirecting to download page after mobile app signup`)
          window.location.href = "https://juice.fitness/download-juice-app"
        }
      } else if (mode === "login") {
        // Successful login - get user data to determine redirect
        console.log(`[AuthForm] Successful login, checking user role`)

        try {
          // Add a small delay to ensure cookies are set
          await new Promise((resolve) => setTimeout(resolve, 100))

          const userResponse = await fetch("/api/auth/me", {
            credentials: "include", // Ensure cookies are sent
          })
          const userData = await userResponse.json()

          console.log(`[AuthForm] User data response:`, userData)

          if (!userResponse.ok) {
            console.error("[AuthForm] Failed to get user data:", userData)
            // Fallback to mobile app success for safety
            router.push("/mobile-app-success")
            return
          }

          if (userData.role === "trainer") {
            console.log(`[AuthForm] User is trainer, redirecting to overview`)
            router.push("/overview")
          } else {
            console.log(`[AuthForm] User is not trainer (role: ${userData.role}), redirecting to mobile app success`)
            router.push("/mobile-app-success")
          }
        } catch (userError) {
          console.error("[AuthForm] Error fetching user data:", userError)
          // Fallback to mobile app success for safety
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

      {showInviteInfo && inviteCode && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <p className="text-green-800 font-medium text-sm">
            {trainerName ? `You've been invited by ${trainerName}!` : "You've been invited to join Juice!"}
          </p>
          <p className="text-green-700 text-sm mt-1">
            {mode === "login"
              ? "Log in to connect with your trainer."
              : "Create an account to connect with your trainer."}
          </p>
          <p className="text-xs text-green-600 mt-2">Invitation code: {inviteCode}</p>
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
                inviteCode
                  ? `/signup?${config.inviteCode}=${inviteCode}${trainerName ? `&tn=${encodeURIComponent(trainerName)}` : ""}`
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
                inviteCode
                  ? `/login?${config.inviteCode}=${inviteCode}${trainerName ? `&tn=${encodeURIComponent(trainerName)}` : ""}`
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
