"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setCookie } from "cookies-next"
import { storeInviteCode } from "@/lib/firebase/user-service"

enum SourceType {
  TRAINER_INVITE = "trainer-invite",
  PROGRAM = "program"
}

interface AuthFormProps {
  mode: "login" | "signup"
  inviteCode?: string
  trainerName?: string
  isTrainerSignup?: boolean
  successUrl?: string
  source?: SourceType
  successCallback?: () => Promise<void>
}

export function AuthForm({ mode, inviteCode = "", trainerName = "", isTrainerSignup = true, successUrl = "", source = SourceType.TRAINER_INVITE, successCallback }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showInviteInfo, setShowInviteInfo] = useState(false)
  const [currentMode, setCurrentMode] = useState(mode)
  console.log("successUrl", successUrl, mode, source)

  useEffect(() => {
    // Update showInviteInfo if inviteCode changes
    setShowInviteInfo(!!inviteCode)
  }, [inviteCode])

  const getSubTitle = () => {
    if (source === SourceType.TRAINER_INVITE && currentMode === "signup") {
      return "Join Juice to connect with your trainer"
    } else if (source === SourceType.PROGRAM && currentMode === "signup") {
      return "Join Juice to add this workout program"
    } else if (source === SourceType.TRAINER_INVITE && currentMode === "login") {
      return "Log in to connect with your trainer"
    } else if (source === SourceType.PROGRAM && currentMode === "login") {
      return "Log in to add this workout program"
    }
    // Fallback for server-side rendering
    return currentMode === "login"
      ? "Enter your email below to login to your account"
      : "Enter your information below to create your account"
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log(
        `[AuthForm] Submitting ${currentMode} form with invitation code: ${inviteCode}, isTrainerSignup: ${isTrainerSignup}`,
      )

      const endpoint = currentMode === "login" ? "/api/auth/login" : "/api/auth/signup"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: currentMode === "signup" ? name : undefined,
          inviteCode: inviteCode || undefined,
          isTrainerSignup: currentMode === "signup" ? isTrainerSignup : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.log(`[AuthForm] ${currentMode} failed:`, data)
        setError(data.error || `Failed to ${currentMode}. Please try again.`)
        setLoading(false)
        return
      }

      console.log(`[AuthForm] ${currentMode} successful:`, data)

      // Set cookies and local storage
      if (data.userId) {
        setCookie("user_id", data.userId)
        localStorage.setItem("user_id", data.userId)

        // If we have an invitation code, store it in the user document
        if (inviteCode && currentMode === "signup") {
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
      if (currentMode === "signup") {
        if (inviteCode) {
          // If coming from an invitation signup, redirect to the download page
          console.log(`[AuthForm] Redirecting to download page after signup with invitation`)
          window.location.href = successUrl ?? "https://juice.fitness/download-juice-app"
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
          window.location.href = successUrl ?? "https://juice.fitness/download-juice-app"
        }
      } else if (currentMode === "login") {
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
            navigateToSuccess()
            return
          }
          console.log("userData", userData)
          if (userData.role === "trainer") {
            console.log(`[AuthForm] User is trainer, redirecting to overview`)
            router.push("/overview")
          } else {
            console.log(`[AuthForm] User is not trainer (role: ${userData.role}), redirecting to mobile app success`)
            navigateToSuccess()
          }
        } catch (userError) {
          console.error("[AuthForm] Error fetching user data:", userError)
          // Fallback to mobile app success for safety
          navigateToSuccess()
        }
      }
    } catch (err) {
      console.error(`[AuthForm] Error during ${currentMode}:`, err)
      setError(`An unexpected error occurred. Please try again.`)
    }
    setLoading(false)
  }

  const navigateToSuccess = async() => {
    if (successCallback) {
      console.log("Calling success callback")
      try {
        await successCallback()
      } catch (err) {
        const error = source === SourceType.PROGRAM ? "Error importing program" : "Error connecting with trainer"
        console.error(error, err)
        setError(error)
        setLoading(false)
        return
      }
    }
    console.log("Navigating to success url", successUrl)
    if (successUrl) {
      window.location.href = successUrl
    } else {
      router.push("/mobile-app-success")
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{currentMode === "login" ? "Login" : "Create an account"}</h1>
        <p className="text-gray-500 text-sm">
          {getSubTitle()}
        </p>
      </div>

      {showInviteInfo && inviteCode && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <p className="text-green-800 font-medium text-sm">
            {trainerName ? `You've been invited by ${trainerName}!` : "You've been invited to join Juice!"}
          </p>
          <p className="text-green-700 text-sm mt-1">
            {currentMode === "login"
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

              <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
        {currentMode === "signup" && (
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
        {currentMode === "signup" && (
        <p className="text-xs text-gray-500">
          By signing up, you agree to our <a href="https://www.juice.fitness/legal?tab=terms" target="_blank" className="underline decoration-[#D2FF28] hover:decoration-[#B8E624]">Terms of Service</a> and acknowledge that our <a href="https://www.juice.fitness/legal?tab=privacy" target="_blank" className="underline decoration-[#D2FF28] hover:decoration-[#B8E624]">Privacy Policy</a> applies to you.
        </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Processing..." : currentMode === "login" ? "Login" : "Create Free Account"}
        </Button>
      </form>
      <div className="text-center text-sm">
        {currentMode === "login" ? (
          <p>
            Don't have an account?
            <button
              type="button"
              onClick={() => {
                setCurrentMode("signup")
              }}
              className="text-black underline decoration-[#D2FF28] hover:decoration-[#B8E624] ml-1"
            >
              Sign up
            </button>
          </p>
          ) : (
            <div className="flex items-center justify-center">
            <p>Already have an account?</p>
            <button
              type="button"
              onClick={() => {
                setCurrentMode("login")
              }}
              className="text-black underline decoration-[#D2FF28] hover:decoration-[#B8E624] ml-1"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
