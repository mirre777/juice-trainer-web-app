export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting debug clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs, doc, getDoc } = await import("firebase/firestore")

    console.log("🔍 [DEBUG] Checking multiple possible collection paths...")

    // Check 1: Direct clients collection
    try {
      console.log("🔍 [DEBUG] Checking: /clients")
      const directClientsRef = collection(db, "clients")
      const directSnapshot = await getDocs(directClientsRef)
      console.log(`📊 [DEBUG] Direct clients collection: ${directSnapshot.size} documents`)
    } catch (error) {
      console.log("❌ [DEBUG] Direct clients collection error:", error)
    }

    // Check 2: User's subcollection
    try {
      console.log(`🔍 [DEBUG] Checking: /users/${userId}/clients`)
      const userClientsRef = collection(db, "users", userId, "clients")
      const userSnapshot = await getDocs(userClientsRef)
      console.log(`📊 [DEBUG] User clients subcollection: ${userSnapshot.size} documents`)

      if (userSnapshot.size > 0) {
        console.log("📋 [DEBUG] Documents in user clients subcollection:")
        userSnapshot.forEach((doc, index) => {
          const data = doc.data()
          console.log(`📄 [DEBUG] Document ${index + 1}:`, {
            id: doc.id,
            name: data.name,
            status: data.status,
            email: data.email,
            createdAt: data.createdAt,
            isTemporary: data.isTemporary,
            userId: data.userId,
          })
        })
      }
    } catch (error) {
      console.log("❌ [DEBUG] User clients subcollection error:", error)
    }

    // Check 3: User document itself
    try {
      console.log(`🔍 [DEBUG] Checking user document: /users/${userId}`)
      const userDocRef = doc(db, "users", userId)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log("👤 [DEBUG] User document data:", {
          id: userDoc.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          clients: userData.clients,
          hasClientsArray: Array.isArray(userData.clients),
          clientsCount: userData.clients?.length || 0,
        })
      } else {
        console.log("❌ [DEBUG] User document does not exist")
      }
    } catch (error) {
      console.log("❌ [DEBUG] User document error:", error)
    }

    // Check 4: All users to see structure
    try {
      console.log("🔍 [DEBUG] Checking all users collection structure...")
      const usersRef = collection(db, "users")
      const usersSnapshot = await getDocs(usersRef)
      console.log(`📊 [DEBUG] Total users: ${usersSnapshot.size}`)

      let trainerCount = 0
      usersSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role === "trainer" || data.user_type === "trainer") {
          trainerCount++
          if (doc.id === userId) {
            console.log("🎯 [DEBUG] Found current user as trainer:", {
              id: doc.id,
              name: data.name,
              role: data.role,
              user_type: data.user_type,
              clients: data.clients,
            })
          }
        }
      })
      console.log(`👨‍🏫 [DEBUG] Total trainers found: ${trainerCount}`)
    } catch (error) {
      console.log("❌ [DEBUG] All users check error:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Debug complete - check console logs",
      userId: userId,
    })
  } catch (error: any) {
    console.error("💥 [DEBUG] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Debug error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
