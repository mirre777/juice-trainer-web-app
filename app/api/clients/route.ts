import { type NextRequest, NextResponse } from "next/server"
import { fetchClients, createClient } from "@/lib/firebase/client-service"
import { getTrainerIdFromCookie } from "@/lib/utils/user"

export async function GET(_: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    // Use the SAME authentication method as your existing working routes
    const trainerId = await getTrainerIdFromCookie()

    console.log("🔍 [API /api/clients] Auth check:", trainerId)

    if (!trainerId) {
      console.log("❌ [API /api/clients] No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API /api/clients] Authenticated trainer:", trainerId)

    // Use your existing fetchClients function - NO server-side filtering
    console.log("📊 [API /api/clients] Calling fetchClients...")
    const allClients = await fetchClients(trainerId)
    console.log("[API /api/clients] Raw clients from fetchClients:", allClients.length)

    // Return ALL clients - no filtering
    console.log("[API /api/clients] Returning ALL clients without any filtering")

    return NextResponse.json({
      success: true,
      clients: allClients,
      totalClients: allClients.length,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("[API /api/clients] === POST REQUEST RECEIVED ===")

  try {
    const trainerId = await getTrainerIdFromCookie()

    console.log("🔍 [API /api/clients] POST Auth check:", trainerId)

    if (!trainerId) {
      console.log("❌ [API /api/clients] POST No trainer ID found in cookies")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 [API /api/clients] POST Request body:", body)

    const { name, email, phone } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    console.log("✅ [API /api/clients] POST Creating client...")
    const result = await createClient(trainerId, {
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
    })

    console.log("📡 [API /api/clients] POST Create result:", result)

    if (result.success && result.clientId) {
      return NextResponse.json({
        success: true,
        clientId: result.clientId,
        message: "Client created successfully"
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to create client"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[API /api/clients] POST ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 })
  }
}
