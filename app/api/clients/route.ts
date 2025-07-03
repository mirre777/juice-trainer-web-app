import { type NextRequest, NextResponse } from "next/server"
import { fetchClients } from "@/lib/firebase/client-service"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/crypto"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Get user from encrypted cookie (same method as /api/auth/me)
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

    // Fetch clients for the trainer
    const clients = await fetchClients(currentUser.uid)
    console.log("[API /api/clients] Raw clients from fetchClients:", clients.length)

    // Filter clients to only include those with linked accounts and active status
    const activeLinkedClients = clients.filter((client) => {
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

    console.log("[API /api/clients] Filtered active linked clients:", activeLinkedClients.length)

    return NextResponse.json({
      success: true,
      clients: activeLinkedClients,
      totalClients: clients.length,
      activeLinkedClients: activeLinkedClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
