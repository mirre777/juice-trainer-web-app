import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/crypto"
import { collection, getDocs, query } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Get user from encrypted cookie (exact same method as /api/auth/me)
    console.log("[API /api/clients] Getting user from cookies...")
    const cookieStore = await cookies()
    const encryptedUserData = cookieStore.get("user-data")?.value

    if (!encryptedUserData) {
      console.log("[API /api/clients] ❌ No user-data cookie found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let currentUser
    try {
      const decryptedData = decrypt(encryptedUserData)
      currentUser = JSON.parse(decryptedData)
      console.log("[API /api/clients] ✅ User from cookie:", {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
      })
    } catch (decryptError) {
      console.error("[API /api/clients] ❌ Failed to decrypt user data:", decryptError)
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    if (!currentUser || !currentUser.uid) {
      console.log("[API /api/clients] ❌ Invalid user data in cookie")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("[API /api/clients] Fetching clients for trainer:", currentUser.uid)

    // Fetch clients directly from Firestore
    const clientsRef = collection(db, "users", currentUser.uid, "clients")
    const clientsQuery = query(clientsRef)
    const snapshot = await getDocs(clientsQuery)

    console.log("[API /api/clients] Raw Firestore query returned:", snapshot.size, "documents")

    const allClients: any[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`[API /api/clients] Processing client ${doc.id}:`, {
        name: data.name,
        status: data.status,
        hasUserId: !!data.userId,
        hasLinkedAccount: data.hasLinkedAccount,
      })

      allClients.push({
        id: doc.id,
        name: data.name || "Unnamed Client",
        email: data.email || "",
        status: data.status || "Active",
        userId: data.userId || "",
        hasLinkedAccount: data.hasLinkedAccount || false,
        progress: data.progress || 0,
        sessions: data.sessions || { completed: 0, total: 0 },
        completion: data.completion || 0,
        notes: data.notes || "",
        bgColor: data.bgColor || "#f3f4f6",
        textColor: data.textColor || "#111827",
        lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
        metrics: data.metrics || [],
        goal: data.goal || "",
        program: data.program || "",
        createdAt: data.createdAt?.toDate?.() || new Date(),
        inviteCode: data.inviteCode || "",
        phone: data.phone || "",
        initials: data.name
          ? data.name
              .split(" ")
              .map((part: string) => part[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)
          : "UC",
      })
    })

    // Filter clients to only include those with linked accounts and active status
    const activeLinkedClients = allClients.filter((client) => {
      const hasUserId = !!client.userId
      const isActive = client.status === "Active"
      const hasLinkedAccount = client.hasLinkedAccount

      console.log(`[API /api/clients] Client ${client.name}:`, {
        id: client.id,
        userId: client.userId || "NO_USER_ID",
        status: client.status,
        hasLinkedAccount,
        hasUserId,
        isActive,
        willInclude: hasUserId && isActive && hasLinkedAccount,
      })

      return hasUserId && isActive && hasLinkedAccount
    })

    console.log("[API /api/clients] ✅ Results:", {
      totalClients: allClients.length,
      activeLinkedClients: activeLinkedClients.length,
    })

    return NextResponse.json({
      success: true,
      clients: activeLinkedClients,
      totalClients: allClients.length,
      activeLinkedClients: activeLinkedClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
