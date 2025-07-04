import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { decrypt } from "@/lib/crypto"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] /api/clients - Starting request")

    // Get the encrypted token from cookies
    const cookieStore = cookies()
    const encryptedToken = cookieStore.get("auth-token")?.value

    if (!encryptedToken) {
      console.log("❌ [API] No auth token found in cookies")
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    // Decrypt the token to get user data
    let userData
    try {
      const decryptedData = decrypt(encryptedToken)
      userData = JSON.parse(decryptedData)
      console.log("✅ [API] Token decrypted successfully, user:", userData.email)
    } catch (error) {
      console.error("❌ [API] Failed to decrypt token:", error)
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 })
    }

    const userId = userData.uid
    if (!userId) {
      console.log("❌ [API] No user ID found in token")
      return NextResponse.json({ success: false, error: "Invalid user data" }, { status: 401 })
    }

    console.log("📊 [API] Fetching ALL clients for user:", userId)

    // Fetch ALL clients from Firestore - no filtering
    const clientsRef = collection(db, "users", userId, "clients")
    const clientsQuery = query(clientsRef, orderBy("createdAt", "desc"))
    const clientsSnapshot = await getDocs(clientsQuery)

    console.log("📈 [API] Raw clients found:", clientsSnapshot.size)

    const allClients: any[] = []

    clientsSnapshot.forEach((doc) => {
      const data = doc.data()

      // Basic validation - only exclude obviously invalid documents
      if (data && typeof data === "object" && data.name && !data.name.includes("channel?VER=")) {
        const client = {
          id: doc.id,
          name: data.name,
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "Active",
          notes: data.notes || "",
          goal: data.goal || "",
          program: data.program || "",
          progress: data.progress || 0,
          sessions: data.sessions || { completed: 0, total: 0 },
          completion: data.completion || 0,
          bgColor: data.bgColor || "#f3f4f6",
          textColor: data.textColor || "#111827",
          lastWorkout: data.lastWorkout || { name: "", date: "", completion: 0 },
          metrics: data.metrics || [],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          inviteCode: data.inviteCode || "",
          userId: data.userId || "",
          hasLinkedAccount: data.hasLinkedAccount || false,
          initials: data.name
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2),
        }
        allClients.push(client)
      }
    })

    console.log("✅ [API] Processed clients:", allClients.length)

    // Return ALL clients - let the frontend handle filtering
    return NextResponse.json({
      success: true,
      clients: allClients,
      totalClients: allClients.length,
      message: `Retrieved ${allClients.length} clients`,
    })
  } catch (error) {
    console.error("❌ [API] Error in /api/clients:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch clients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
