"use client"

import { useEffect, useState } from "react"

export default function DebugEnvPage() {
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    const runDiagnostics = () => {
      const logs: string[] = []

      // Override console.log to capture output
      const originalLog = console.log
      console.log = (...args) => {
        const message = args
          .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
          .join(" ")
        logs.push(message)
        originalLog(...args)
      }

      try {
        logs.push("🔍 CHECKING ENVIRONMENT VARIABLES...\n")

        // Firebase Client Configuration (Public)
        const clientVars = {
          NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        }

        logs.push("📱 FIREBASE CLIENT CONFIGURATION:")
        let clientMissing = 0
        Object.entries(clientVars).forEach(([key, value]) => {
          const status = value ? "✅" : "❌"
          const displayValue = value ? (key.includes("KEY") ? "[HIDDEN]" : value.substring(0, 20) + "...") : "MISSING"
          logs.push(`  ${status} ${key}: ${displayValue}`)
          if (!value) clientMissing++
        })

        logs.push("\n🔐 FIREBASE SERVER CONFIGURATION:")
        logs.push("  ⚠️  Server environment variables cannot be checked from client-side")
        logs.push("  These would need to be checked in an API route or server component")

        logs.push("\n⚙️  OTHER PUBLIC CONFIGURATION:")
        const otherPublicVars = {
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        }

        let otherMissing = 0
        Object.entries(otherPublicVars).forEach(([key, value]) => {
          const status = value ? "✅" : "❌"
          const displayValue = value || "MISSING"
          logs.push(`  ${status} ${key}: ${displayValue}`)
          if (!value) otherMissing++
        })

        logs.push("\n📊 CLIENT-SIDE SUMMARY:")
        logs.push(`  Client variables missing: ${clientMissing}/7`)
        logs.push(`  Other public variables missing: ${otherMissing}/2`)

        // Current URL and domain info
        logs.push("\n🌍 CURRENT ENVIRONMENT INFO:")
        logs.push(`  Current URL: ${window.location.href}`)
        logs.push(`  Domain: ${window.location.hostname}`)
        logs.push(`  Protocol: ${window.location.protocol}`)
        logs.push(`  Port: ${window.location.port || "default"}`)

        // Firebase OAuth domain issue analysis
        logs.push("\n🔥 FIREBASE OAUTH DOMAIN ANALYSIS:")
        const currentDomain = window.location.hostname
        const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

        logs.push(`  Current domain: ${currentDomain}`)
        logs.push(`  Firebase auth domain: ${authDomain || "MISSING"}`)

        if (currentDomain.includes("vercel.app")) {
          logs.push("  ⚠️  You're on a Vercel preview domain")
          logs.push("  💡 This domain needs to be added to Firebase authorized domains")
          logs.push("  📋 Go to Firebase Console → Authentication → Settings → Authorized domains")
          logs.push(`  ➕ Add: ${currentDomain}`)
        }

        // Authentication cookie check
        logs.push("\n🍪 AUTHENTICATION COOKIE CHECK:")
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
          const status = cookies[cookieName] ? "✅" : "❌"
          logs.push(`  ${status} ${cookieName}: ${cookies[cookieName] ? "Present" : "Missing"}`)
        })

        // Local storage check
        logs.push("\n💾 LOCAL STORAGE CHECK:")
        try {
          const authKeys = ["user", "token", "firebase:authUser"]
          authKeys.forEach((key) => {
            const value = localStorage.getItem(key)
            const status = value ? "✅" : "❌"
            logs.push(`  ${status} ${key}: ${value ? "Present" : "Missing"}`)
          })
        } catch (e) {
          logs.push("  ❌ Cannot access localStorage")
        }

        logs.push("\n🎯 DIAGNOSIS BASED ON YOUR 401 ERROR:")
        if (clientMissing > 0) {
          logs.push("  ❌ Missing Firebase client configuration")
          logs.push("  💡 This prevents Firebase from initializing properly")
        }

        if (currentDomain.includes("vercel.app")) {
          logs.push("  ❌ Preview domain not authorized in Firebase")
          logs.push("  💡 Add your preview domain to Firebase authorized domains")
        }

        if (!cookies["auth_token"] && !cookies["user_id"]) {
          logs.push("  ❌ No authentication cookies found")
          logs.push("  💡 User is not logged in or session expired")
        }

        logs.push("\n🔧 IMMEDIATE FIXES NEEDED:")
        logs.push("1. Add missing environment variables to Vercel")
        logs.push("2. Add preview domain to Firebase authorized domains")
        logs.push("3. Check if user needs to log in again")
      } catch (error) {
        logs.push(`❌ Error running diagnostics: ${error}`)
      } finally {
        // Restore original console.log
        console.log = originalLog
        setResults(logs)
      }
    }

    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Environment Variables Diagnostic</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Diagnostic Results</h2>
          <p className="text-gray-600 mb-4">
            Check the browser console for detailed output. Results are also displayed below:
          </p>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            {results.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Current Issues Detected</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• 401 Unauthorized errors in preview environment</li>
            <li>• Firebase OAuth domain not authorized for preview URL</li>
            <li>• Missing user_id cookie</li>
            <li>• ProtectedRoute failing authentication checks</li>
          </ul>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Quick Fixes</h3>
          <ol className="text-blue-700 space-y-2">
            <li>
              1. <strong>Add preview domain to Firebase:</strong> Go to Firebase Console → Authentication → Settings →
              Authorized domains
            </li>
            <li>
              2. <strong>Add missing environment variables:</strong> Check Vercel dashboard for missing Firebase config
            </li>
            <li>
              3. <strong>Clear cookies and try logging in again:</strong> Authentication state might be corrupted
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
