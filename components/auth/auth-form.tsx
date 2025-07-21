"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface AuthFormProps {
  mode: "login" | "signup"
  invitationCode?: string
}

export function AuthForm({ mode, invitationCode }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formId = `FORM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`[AuthForm] 🔄 Starting ${mode} process (ID: ${formId})`)
    console.log(`[AuthForm] Email: ${email}`)
    console.log(`[AuthForm] Invitation code: ${invitationCode || "None"}`)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup"
      const payload = {
        email,
        password,
        ...(mode === "signup" && { name }),
        ...(invitationCode && { invitationCode }),
      }

      console.log(`[AuthForm] 📤 Sending request to ${endpoint}`)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log(`[AuthForm] 📥 Response status: ${response.status}`)
      console.log(`[AuthForm] Response data:`, data)

      if (!response.ok) {
        console.log(`[AuthForm] ❌ ${mode} failed:`, data.error)
        setError(data.error || `${mode} failed`)
        return
      }

      console.log(`[AuthForm] ✅ ${mode} successful`)

      // For login, check user role and redirect appropriately
      if (mode === "login") {
        console.log(`[AuthForm] 🔍 Checking user role...`)

        try {
          const meResponse = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
          })

          console.log(`[AuthForm] /api/auth/me status: ${meResponse.status}`)

          if (meResponse.ok) {
            const userData = await meResponse.json()
            console.log(`[AuthForm] User data received:`, userData)

            // Extract role from response (handle both flat and nested formats)
            const userRole = userData.role || userData.user?.role
            console.log(`[AuthForm] Extracted role: ${userRole}`)
            console.log(`[AuthForm] Role type: ${typeof userRole}`)
            console.log(`[AuthForm] Is trainer: ${userRole === "trainer"}`)

            if (userRole === "trainer") {
              console.log(`[AuthForm] ✅ Trainer detected, redirecting to /overview`)
              router.push("/overview")
            } else {
              console.log(`[AuthForm] 👤 Non-trainer user (role: ${userRole}), redirecting to mobile app success`)
              router.push("/mobile-app-success")
            }
          } else {
            const errorData = await meResponse.json()
            console.error(`[AuthForm] ❌ Failed to get user data:`, errorData)
            console.log(`[AuthForm] Defaulting to mobile app success due to role check failure`)
            router.push("/mobile-app-success")
          }
        } catch (roleCheckError) {
          console.error(`[AuthForm] ❌ Error checking user role:`, roleCheckError)
          console.log(`[AuthForm] Defaulting to mobile app success due to role check error`)
          router.push("/mobile-app-success")
        }
      } else {
        // For signup, redirect to appropriate page
        router.push("/mobile-app-success")
      }
    } catch (error: any) {
      console.error(`[AuthForm] ❌ ${mode} error:`, error)
      setError(`Network error. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Login" : "Sign Up"}</CardTitle>
        <CardDescription>
          {mode === "login" ? "Enter your email below to login to your account" : "Create your account to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Login" : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
