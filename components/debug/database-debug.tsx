"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export function DatabaseDebug() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkDatabase = async () => {
    if (!user?.uid) {
      setDebugInfo({ error: "No user authenticated" })
      return
    }

    setLoading(true)
    try {
      const userId = user.uid
      console.log("Checking database for user:", userId)

      // Check if user document exists
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      const userExists = userDoc.exists()
      const userData = userExists ? userDoc.data() : null

      // Check clients subcollection
      const clientsRef = collection(db, "users", userId, "clients")
      const clientsSnapshot = await getDocs(clientsRef)

      const clients = []
      clientsSnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      // Check if there are any users in the database
      const usersRef = collection(db, "users")
      const usersSnapshot = await getDocs(usersRef)
      const allUsers = []
      usersSnapshot.forEach((doc) => {
        allUsers.push({
          id: doc.id,
          name: doc.data().name || "No name",
          email: doc.data().email || "No email",
        })
      })

      setDebugInfo({
        currentUserId: userId,
        userExists,
        userData,
        clientsCount: clients.length,
        clients,
        allUsersCount: allUsers.length,
        allUsers: allUsers.slice(0, 5), // Show first 5 users
      })
    } catch (error) {
      console.error("Debug error:", error)
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createTestClient = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const { createClient } = await import("@/lib/firebase/client-service")

      const result = await createClient(user.uid, {
        name: "Test Client " + Date.now(),
        email: "test@example.com",
        phone: "+1234567890",
        goal: "Get stronger",
        notes: "This is a test client",
        program: "Beginner Program",
      })

      if (result.success) {
        console.log("Test client created:", result.clientId)
        // Refresh debug info
        await checkDatabase()
      } else {
        console.error("Failed to create test client:", result.error)
      }
    } catch (error) {
      console.error("Error creating test client:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkDatabase} disabled={loading}>
            {loading ? "Checking..." : "Check Database"}
          </Button>
          <Button onClick={createTestClient} disabled={loading} variant="outline">
            Create Test Client
          </Button>
        </div>

        {debugInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
