"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const addResult = (result: DiagnosticResult) => {
    setResults((prev) => [...prev, result])
    console.log(`[${result.category}] ${result.status.toUpperCase()}: ${result.message}`, result.details || "")
  }

  const runDiagnostics = async () => {
    console.log("🔍 Starting Environment Diagnostics...")

    // Check Environment Variables
    console.log("\n=== ENVIRONMENT VARIABLES CHECK ===")
    checkEnvironmentVariables()

    // Check Firebase Configuration
    console.log("\n=== FIREBASE CONFIGURATION CHECK ===")
    await checkFirebaseConfig()

    // Check Authentication State
    console.log("\n=== AUTHENTICATION STATE CHECK ===")
    checkAuthState()

    // Check Domain Configuration
    console.log("\n=== DOMAIN CONFIGURATION CHECK ===")
    checkDomainConfig()

    // Test API Endpoints
    console.log("\n=== API ENDPOINTS CHECK ===")
    await testApiEndpoints()

    setLoading(false)
    console.log("\n✅ Diagnostics Complete!")
  }

  const checkEnvironmentVariables = () => {
    const requiredEnvVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
      "ENCRYPTION_KEY",
    ]

    const missingVars: string[] = []
    const presentVars: string[] = []

    requiredEnvVars.forEach((varName) => {
      const value = process.env[varName]
      if (!value || value.trim() === "") {
        missingVars.push(varName)
      } else {
        presentVars.push(varName)
      }
    })

    if (missingVars.length === 0) {
      addResult({
        category: "Environment Variables",
        status: "success",
        message: "All required environment variables are present",
        details: { presentVars },
      })
    } else {
      addResult({
        category: "Environment Variables",
        status: "error",
        message: `Missing ${missingVars.length} required environment variables`,
        details: { missingVars, presentVars },
      })
    }

    // Check for common issues
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (apiKey && !apiKey.startsWith("AIza")) {
      addResult({
        category: "Environment Variables",
        status: "warning",
        message: "Firebase API key format looks incorrect",
        details: { apiKey: apiKey.substring(0, 10) + "..." },
      })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (projectId && projectId.includes(" ")) {
      addResult({
        category: "Environment Variables",
        status: "warning",
        message: "Firebase project ID contains spaces (should not)",
        details: { projectId },
      })
    }
  }

  const checkFirebaseConfig = async () => {
    try {
      // Check if Firebase can be imported
      const { initializeApp, getApps } = await import("firebase/app")
      const { getAuth } = await import("firebase/auth")
      const { getFirestore } = await import("firebase/firestore")

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }

      // Try to initialize Firebase
      let app
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApps()[0]
      }

      const auth = getAuth(app)
      const db = getFirestore(app)

      addResult({
        category: "Firebase Configuration",
        status: "success",
        message: "Firebase initialized successfully",
        details: {
          projectId: app.options.projectId,
          authDomain: app.options.authDomain,
          hasAuth: !!auth,
          hasFirestore: !!db,
        },
      })
    } catch (error: any) {
      addResult({
        category: "Firebase Configuration",
        status: "error",
        message: "Failed to initialize Firebase",
        details: {
          error: error.message,
          code: error.code,
        },
      })
    }
  }

  const checkAuthState = () => {
    // Check cookies
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    const authCookies = Object.keys(cookies).filter(
      (key) => key.includes("auth") || key.includes("token") || key.includes("session"),
    )

    if (authCookies.length === 0) {
      addResult({
        category: "Authentication State",
        status: "warning",
        message: "No authentication cookies found - this explains your 401 errors!",
        details: {
          allCookies: Object.keys(cookies),
          explanation: "You cleared cookies recently - need to log in again",
        },
      })
    } else {
      addResult({
        category: "Authentication State",
        status: "success",
        message: `Found ${authCookies.length} authentication-related cookies`,
        details: { authCookies },
      })
    }

    // Check localStorage
    const localStorageKeys = Object.keys(localStorage).filter(
      (key) => key.includes("firebase") || key.includes("auth") || key.includes("user"),
    )

    addResult({
      category: "Authentication State",
      status: localStorageKeys.length > 0 ? "success" : "warning",
      message: `Found ${localStorageKeys.length} auth-related localStorage items`,
      details: {
        localStorageKeys,
        note: localStorageKeys.length === 0 ? "Cleared localStorage explains missing auth state" : "",
      },
    })
  }

  const checkDomainConfig = () => {
    const currentDomain = window.location.hostname
    const currentOrigin = window.location.origin
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

    addResult({
      category: "Domain Configuration",
      status: "success",
      message: "Current domain information",
      details: {
        currentDomain,
        currentOrigin,
        authDomain,
        isLocalhost: currentDomain === "localhost",
        isVercelPreview: currentDomain.includes("vercel.app"),
      },
    })

    // Check if current domain matches auth domain
    if (authDomain && !currentOrigin.includes(authDomain.replace(".firebaseapp.com", ""))) {
      addResult({
        category: "Domain Configuration",
        status: "warning",
        message: "Current domain may not be authorized for Firebase Auth",
        details: {
          suggestion: `Add ${currentOrigin} to Firebase Console -> Authentication -> Settings -> Authorized domains`,
        },
      })
    }
  }

  const testApiEndpoints = async () => {
    const endpoints = ["/api/health", "/api/debug/simple-firebase-test", "/api/debug/user-info"]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        const data = await response.text()

        addResult({
          category: "API Endpoints",
          status: response.ok ? "success" : "error",
          message: `${endpoint}: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            response: data.substring(0, 200) + (data.length > 200 ? "..." : ""),
          },
        })
      } catch (error: any) {
        addResult({
          category: "API Endpoints",
          status: "error",
          message: `${endpoint}: Failed to fetch`,
          details: { error: error.message },
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Environment Diagnostics</h1>
        <p className="text-gray-600">
          Checking environment variables, Firebase configuration, and authentication state. Check the browser console
          for detailed logs.
        </p>
      </div>

      {loading && (
        <Alert className="mb-6">
          <AlertDescription>Running diagnostics... Check the browser console for real-time results.</AlertDescription>
        </Alert>
      )}

      <Alert className="mb-6 bg-yellow-50 border-yellow-200">
        <AlertDescription>
          <strong>🍪 Cookie Issue Detected:</strong> You mentioned clearing cookies recently. This explains the 401
          errors! Your app relies on authentication cookies, and clearing them means you need to log in again.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{result.category}</CardTitle>
                <Badge className={getStatusColor(result.status)}>{result.status.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{result.message}</p>
              {result.details && (
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && (
        <Alert className="mt-6">
          <AlertDescription>
            <strong>Next Steps:</strong>
            <br />
            1. ✅ Try logging in again (your cleared cookies explain the 401 errors)
            <br />
            2. Check the browser console for detailed diagnostic information
            <br />
            3. Fix any missing environment variables in your Vercel dashboard
            <br />
            4. Add your preview domain to Firebase Console → Authentication → Settings → Authorized domains
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
