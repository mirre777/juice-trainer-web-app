import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 Starting /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      console.log("🔍 Querying Firestore for clients...")

      // Query clients where trainerId matches the current user
      const clientsRef = collection(db, "clients")
      const q = query(clientsRef, where("trainerId", "==", userId))
      const querySnapshot = await getDocs(q)

      const clients: any[] = []
      querySnapshot.forEach((doc) => {
        clients.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      console.log("✅ Found clients:", clients.length)
      return NextResponse.json(clients)
    } catch (firestoreError: any) {
      console.error("💥 Firestore error:", firestoreError)
      return NextResponse.json(
        {
          error: "Database error",
          details: firestoreError?.message || "Failed to fetch clients",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("🚀 Starting POST /api/clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Request body:", body)

    // Add the client to Firestore
    const clientsRef = collection(db, "clients")

    const newClient = {
      ...body,
      trainerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await addDoc(clientsRef, newClient)
    console.log("✅ Client created with ID:", docRef.id)

    return NextResponse.json({
      id: docRef.id,
      ...newClient,
    })
  } catch (error: any) {
    console.error("💥 Error creating client:", error)
    return NextResponse.json(
      {
        error: "Failed to create client",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
