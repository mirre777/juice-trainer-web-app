import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId") || "5tVdK6LXCifZgjxD7rml3nEOXmh1"
    const clientId = searchParams.get("clientId") || "CGLJmpv59IngpsYpW7PZ"

    console.log(`[DEBUG] Checking client-user link for trainer: ${trainerId}, client: ${clientId}`)

    // Step 1: Get client document
    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      return NextResponse.json(
        {
          error: "Client document not found",
          path: `users/${trainerId}/clients/${clientId}`,
        },
        { status: 404 },
      )
    }

    const clientData = clientDoc.data()
    console.log(`[DEBUG] Client data:`, {
      name: clientData.name,
      email: clientData.email,
      userId: clientData.userId || "MISSING",
      status: clientData.status,
    })

    const result = {
      client: {
        id: clientId,
        name: clientData.name,
        email: clientData.email,
        status: clientData.status,
        userId: clientData.userId || null,
        path: `users/${trainerId}/clients/${clientId}`,
      },
      user: null,
      canSendProgram: false,
      issues: [],
    }

    // Step 2: Check user document if userId exists
    if (clientData.userId) {
      console.log(`[DEBUG] Checking user document: ${clientData.userId}`)

      const userRef = doc(db, "users", clientData.userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log(`[DEBUG] User data:`, {
          name: userData.name,
          email: userData.email,
          status: userData.status,
          trainers: userData.trainers || [],
        })

        result.user = {
          id: clientData.userId,
          name: userData.name,
          email: userData.email,
          status: userData.status,
          trainers: userData.trainers || [],
          path: `users/${clientData.userId}`,
        }

        // Check if trainer is in user's trainers array
        if (userData.trainers && userData.trainers.includes(trainerId)) {
          result.canSendProgram = true
        } else {
          result.issues.push("Trainer not in user's trainers array")
        }
      } else {
        console.log(`[DEBUG] User document does not exist: ${clientData.userId}`)
        result.issues.push(`User document does not exist at users/${clientData.userId}`)
      }
    } else {
      result.issues.push("Client document missing userId field")
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[DEBUG] Error checking client-user link:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
