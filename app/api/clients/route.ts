import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchClients } from "@/lib/firebase/client-service"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Use the same authentication method as your existing working routes
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userIdAlt = cookieStore.get("userId")?.value // Fallback for inconsistent naming
    const trainerId = userId || userIdAlt

    console.log("🔍 [API /api/clients] Auth check:", {
      userId,
      userIdAlt,
      trainerId,
      hasCookies: !!cookieStore,
    })

    if (!trainerId) {
      console.log("❌ [API /api/clients] No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API /api/clients] Authenticated trainer:", trainerId)

    // Use your existing fetchClients function
    console.log("📊 [API /api/clients] Calling fetchClients...")
    const allClients = await fetchClients(trainerId)
    console.log("[API /api/clients] Raw clients from fetchClients:", allClients.length)

    // Get filter parameter from query string (optional)
    const url = new URL(request.url)
    const filterType = url.searchParams.get("filter") || "active-linked" // default to current behavior

    let filteredClients = allClients

    switch (filterType) {
      case "all":
        // Show all clients regardless of status or linking
        filteredClients = allClients
        console.log("[API /api/clients] Filter: ALL clients")
        break

      case "active":
        // Show only active clients (regardless of linking)
        filteredClients = allClients.filter((client) => client.status === "Active")
        console.log("[API /api/clients] Filter: ACTIVE clients only")
        break

      case "linked":
        // Show only clients with linked accounts (regardless of status)
        filteredClients = allClients.filter((client) => {
          const hasUserId = !!client.userId
          const hasLinkedAccount = client.hasLinkedAccount
          return hasUserId && hasLinkedAccount
        })
        console.log("[API /api/clients] Filter: LINKED clients only")
        break

      case "active-linked":
      default:
        // Current behavior: Show only active clients with linked accounts
        filteredClients = allClients.filter((client) => {
          const hasUserId = !!client.userId
          const isActive = client.status === "Active"
          const hasLinkedAccount = client.hasLinkedAccount
          return hasUserId && isActive && hasLinkedAccount
        })
        console.log("[API /api/clients] Filter: ACTIVE + LINKED clients only")
        break
    }

    // Log filtering results
    console.log("[API /api/clients] Filtering results:", {
      totalClients: allClients.length,
      filteredClients: filteredClients.length,
      filterType,
      breakdown: {
        active: allClients.filter((c) => c.status === "Active").length,
        linked: allClients.filter((c) => !!c.userId && c.hasLinkedAccount).length,
        activeLinked: allClients.filter((c) => c.status === "Active" && !!c.userId && c.hasLinkedAccount).length,
      },
    })

    // Log some examples of filtered out clients for debugging
    const excludedClients = allClients.filter((client) => !filteredClients.includes(client)).slice(0, 5)
    excludedClients.forEach((client) => {
      console.log(`[API /api/clients] Excluded client "${client.name}":`, {
        status: client.status,
        hasUserId: !!client.userId,
        hasLinkedAccount: client.hasLinkedAccount,
        reason: !client.userId
          ? "No userId"
          : !client.hasLinkedAccount
            ? "Not linked"
            : client.status !== "Active"
              ? "Not active"
              : "Unknown",
      })
    })

    return NextResponse.json({
      success: true,
      clients: filteredClients,
      totalClients: allClients.length,
      filteredCount: filteredClients.length,
      filterType,
      breakdown: {
        total: allClients.length,
        active: allClients.filter((c) => c.status === "Active").length,
        linked: allClients.filter((c) => !!c.userId && c.hasLinkedAccount).length,
        activeLinked: allClients.filter((c) => c.status === "Active" && !!c.userId && c.hasLinkedAccount).length,
      },
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}
