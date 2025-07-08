import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[LIST-USERS] Starting user enumeration...")

    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs, query, limit } = await import("firebase/firestore")

    const usersRef = collection(db, "users")
    const usersQuery = query(usersRef, limit(10)) // Limit to first 10 users
    const snapshot = await getDocs(usersQuery)

    if (snapshot.empty) {
      return NextResponse.json({
        message: "No users found in the database",
        count: 0,
        users: [],
      })
    }

    const users: any[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        email: data.email,
        name: data.name || "No name",
        role: data.role || "No role",
        user_type: data.user_type || "No user_type",
        hasFirebaseAuth: data.hasFirebaseAuth || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || "No date",
      })
    })

    console.log(`[LIST-USERS] Found ${users.length} users`)

    return NextResponse.json({
      message: `Found ${users.length} users`,
      count: users.length,
      users,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[LIST-USERS] Error listing users:", error)
    return NextResponse.json(
      {
        error: "Failed to list users",
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
