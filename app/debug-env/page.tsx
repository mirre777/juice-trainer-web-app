"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DiagnosticResult {
  category: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export default function DebugEnvPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const diagnostics: DiagnosticResult[] = []

    // Check Environment Variables
    console.log("🔍 Checking Environment Variables...")
    const envVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]

    envVars.forEach((varName) => {
      const value = process.env[varName]
      if (value) {
        diagnostics.push({
          category: "Environment Variables",
          status: "success",
          message: `${varName}: Present`,
          details: value.substring(0, 10) + "...",
        })
        console.log(`✅ ${varName}: Present`)
      } else {
        diagnostics.push({
          category: "Environment Variables",
          status: "error",
          message: `${varName}: Missing`,
        })
        console.log(`❌ ${varName}: Missing`)
      }
    })

    // Check Cookies
    console.log("🍪 Checking Authentication Cookies...")
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    const authCookies = ["auth_token", "user_id", "auth-token"]
    authCookies.forEach((cookieName) => {
      if (cookies[cookieName]) {
        diagnostics.push({
          category: "Authentication Cookies",
          status: "success",
          message: `${cookieName}: Present`,
          details: cookies[cookieName]?.substring(0, 20) + "...",
        })
        console.log(`✅ Cookie ${cookieName}: Present`)
      } else {
        diagnostics.push({
          category: "Authentication Cookies",
          status: "error",
          message: `${cookieName}: Missing`,
        })
        console.log(`❌ Cookie ${cookieName}: Missing`)
      }
    })

    // Check Local Storage
    console.log("💾 Checking Local Storage...")
    try {
      const authData = localStorage.getItem("auth")
      const userData = localStorage.getItem("user")

      if (authData) {
        diagnostics.push({
          category: "Local Storage",
          status: "success",
          message: "Auth data found in localStorage",
        })
        console.log("✅ Auth data in localStorage: Present")
      } else {
        diagnostics.push({
          category: "Local Storage",
          status: "warning",
          message: "No auth data in localStorage",
        })
        console.log("⚠️ Auth data in localStorage: Missing")
      }
    } catch (error) {
      diagnostics.push({
        category: "Local Storage",
        status: "error",
        message: "Cannot access localStorage",
      })
      console.log("❌ Cannot access localStorage:", error)
    }

    // Check Current Domain
    console.log("🌐 Checking Current Domain...")
    const currentDomain = window.location.hostname
    diagnostics.push({
      category: "Domain Configuration",
      status: "warning",
      message: `Current domain: ${currentDomain}`,
      details: "Make sure this domain is added to Firebase Auth authorized domains",
    })
    console.log(`🌐 Current domain: ${currentDomain}`)

    // Test API Endpoints
    console.log("🔌 Testing API Endpoints...")
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (response.ok) {
        diagnostics.push({
          category: "API Endpoints",
          status: "success",
          message: "/api/auth/me: Working",
          details: data,
        })
        console.log("✅ /api/auth/me: Working", data)
      } else {
        diagnostics.push({
          category: "API Endpoints",
          status: "error",
          message: `/api/auth/me: ${response.status} ${response.statusText}`,
          details: data,
        })
        console.log(`❌ /api/auth/me: ${response.status}`, data)
      }
    } catch (error) {
      diagnostics.push({
        category: "API Endpoints",
        status: "error",
        message: "/api/auth/me: Network error",
        details: error,
      })
      console.log("❌ /api/auth/me: Network error", error)
    }

    // Check Firebase Configuration
    console.log("🔥 Checking Firebase Configuration...")
    try {
      // This will be available on client side
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }

      const missingKeys = Object.entries(firebaseConfig).filter(([key, value]) => !value)

      if (missingKeys.length === 0) {
        diagnostics.push({
          category: "Firebase Configuration",
          status: "success",
          message: "All Firebase config keys present",
        })
        console.log("✅ Firebase configuration: Complete")
      } else {
        diagnostics.push({
          category: "Firebase Configuration",
          status: "error",
          message: `Missing Firebase keys: ${missingKeys.map(([key]) => key).join(", ")}`,
        })
        console.log("❌ Missing Firebase keys:", missingKeys)
      }
    } catch (error) {
      diagnostics.push({
        category: "Firebase Configuration",
        status: "error",
        message: "Error checking Firebase config",
      })
      console.log("❌ Firebase config error:", error)
    }

    setResults(diagnostics)
    setLoading(false)

    console.log("🏁 Diagnostics Complete!")
    console.log("Results:", diagnostics)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "warning":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      default:
        return "ℹ️"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Environment Diagnostics</h1>
        <div className="text-center">Running diagnostics... Check console for real-time results.</div>
      </div>
    )
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    },
    {} as Record<string, DiagnosticResult[]>,
  )

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Environment Diagnostics</h1>

      <div className="grid gap-6">
        {Object.entries(groupedResults).map(([category, categoryResults]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span>{getStatusIcon(result.status)}</span>
                    <div className="flex-1">
                      <div className={getStatusColor(result.status)}>{result.message}</div>
                      {result.details && (
                        <div className="text-sm text-gray-500 mt-1">
                          {typeof result.details === "string"
                            ? result.details
                            : JSON.stringify(result.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Fixes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              🍪 <strong>Missing Cookies:</strong> Try logging in again - cookies should be set on successful login
            </div>
            <div>
              🌐 <strong>OAuth Domain Error:</strong> Add your current domain to Firebase Console → Authentication →
              Settings → Authorized domains
            </div>
            <div>
              🔑 <strong>Missing Env Vars:</strong> Add missing environment variables to your deployment platform
            </div>
            <div>
              🔄 <strong>401 Errors:</strong> Usually caused by missing or expired authentication cookies
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
