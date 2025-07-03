"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, getCurrentUserData } from "@/lib/firebase/user-service"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebug() {
  const [authState, setAuthState] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Monitor auth state changes
  useEffect(() => {
    const auth = getAuth()
    console.log("[AuthDebug] Setting up auth state listener")

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[AuthDebug] Auth state changed:", {
        exists: !!user,
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
      })
      setAuthState(user)
    })

    return () => unsubscribe()
  }, [])

  const testGetCurrentUser = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[AuthDebug] Testing getCurrentUser...")
      const user = await getCurrentUser()
      console.log("[AuthDebug] getCurrentUser result:", user)
      setCurrentUser(user)
    } catch (err) {
      console.error("[AuthDebug] getCurrentUser error:", err)
      setError(`getCurrentUser failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testGetCurrentUserData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[AuthDebug] Testing getCurrentUserData...")
      const data = await getCurrentUserData()
      console.log("[AuthDebug] getCurrentUserData result:", data)
      setUserData(data)
    } catch (err) {
      console.error("[AuthDebug] getCurrentUserData error:", err)
      setError(`getCurrentUserData failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Auth State (Real-time)</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(
                authState
                  ? {
                      uid: authState.uid,
                      email: authState.email,
                      emailVerified: authState.emailVerified,
                      displayName: authState.displayName,
                    }
                  : null,
                null,
                2,
              )}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button onClick={testGetCurrentUser} disabled={loading}>
              Test getCurrentUser()
            </Button>
            <Button onClick={testGetCurrentUserData} disabled={loading}>
              Test getCurrentUserData()
            </Button>
          </div>

          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}

          {currentUser && (
            <div>
              <h3 className="font-semibold mb-2">getCurrentUser() Result</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(
                  {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    emailVerified: currentUser.emailVerified,
                    displayName: currentUser.displayName,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}

          {userData && (
            <div>
              <h3 className="font-semibold mb-2">getCurrentUserData() Result</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(userData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
