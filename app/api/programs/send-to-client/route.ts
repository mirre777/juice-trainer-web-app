import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { programConversionService } from "@/services/program-conversion-service"

export async function POST(request: Request) {
  console.log(`[SEND_TO_CLIENT_API] 🚀 === SEND TO CLIENT REQUEST STARTED ===`)
  console.log(`[SEND_TO_CLIENT_API] 📅 Timestamp: ${new Date().toISOString()}`)
  console.log(`[SEND_TO_CLIENT_API] 🌐 Request URL: ${request.url}`)
  console.log(`[SEND_TO_CLIENT_API] 📡 Request method: ${request.method}`)

  try {
    // Parse request body
    const body = await request.json()
    console.log(`[SEND_TO_CLIENT_API] 📦 Request body received:`, JSON.stringify(body, null, 2))
    console.log(`[SEND_TO_CLIENT_API] 🔍 Body analysis:`, {
      hasProgramData: !!body.programData,
      hasClientId: !!body.clientId,
      programDataType: typeof body.programData,
      clientIdType: typeof body.clientId,
      programDataKeys: body.programData ? Object.keys(body.programData) : [],
      bodyKeys: Object.keys(body),
    })

    const { programData, clientId } = body

    // Validate required fields
    if (!programData) {
      console.log(`[SEND_TO_CLIENT_API] ❌ VALIDATION FAILED: Missing programData`)
      return NextResponse.json({ error: "Program data is required" }, { status: 400 })
    }

    if (!clientId) {
      console.log(`[SEND_TO_CLIENT_API] ❌ VALIDATION FAILED: Missing clientId`)
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    console.log(`[SEND_TO_CLIENT_API] ✅ Basic validation passed`)
    console.log(`[SEND_TO_CLIENT_API] 🎯 Target client ID: ${clientId}`)
    console.log(
      `[SEND_TO_CLIENT_API] 📋 Program title: ${programData.program_title || programData.title || programData.name || "NO_TITLE"}`,
    )

    // Get current user from session/auth
    console.log(`[SEND_TO_CLIENT_API] 🔍 Getting current user from session...`)
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      console.log(`[SEND_TO_CLIENT_API] ❌ AUTHENTICATION FAILED: No current user`)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log(`[SEND_TO_CLIENT_API] ✅ Authentication successful:`, {
      userId: currentUser.uid,
      email: currentUser.email || "NO_EMAIL",
      name: currentUser.name || "NO_NAME",
    })

    const trainerId = currentUser.uid
    console.log(`[SEND_TO_CLIENT_API] 🎯 Trainer ID: ${trainerId}`)

    // Get client's userId
    console.log(`[SEND_TO_CLIENT_API] 🔍 Step 1: Getting client's userId...`)
    console.log(`[SEND_TO_CLIENT_API] 📍 Will query: /users/${trainerId}/clients/${clientId}`)

    const clientUserId = await programConversionService.getClientUserId(trainerId, clientId)

    if (!clientUserId) {
      console.log(`[SEND_TO_CLIENT_API] ❌ CLIENT LOOKUP FAILED: No userId found for client`)
      console.log(`[SEND_TO_CLIENT_API] 🔍 Possible reasons:`)
      console.log(`[SEND_TO_CLIENT_API]   1. Client document doesn't exist at /users/${trainerId}/clients/${clientId}`)
      console.log(`[SEND_TO_CLIENT_API]   2. Client document exists but has no userId field`)
      console.log(`[SEND_TO_CLIENT_API]   3. Client hasn't completed signup process`)
      console.log(`[SEND_TO_CLIENT_API]   4. Client is temporary/pending`)
      return NextResponse.json({ error: "Client not found or not linked to user account" }, { status: 404 })
    }

    console.log(`[SEND_TO_CLIENT_API] ✅ Found client userId: ${clientUserId}`)
    console.log(`[SEND_TO_CLIENT_API] 📍 Will create program at: /users/${clientUserId}/programs/{programId}`)
    console.log(`[SEND_TO_CLIENT_API] 📍 Will create routines at: /users/${clientUserId}/routines/{routineId}`)

    // Convert and send program
    console.log(`[SEND_TO_CLIENT_API] 🔍 Step 2: Converting and sending program...`)
    console.log(`[SEND_TO_CLIENT_API] 🔄 Starting program conversion process...`)

    const programId = await programConversionService.convertAndSendProgram(programData, clientUserId)

    console.log(`[SEND_TO_CLIENT_API] ✅ Program conversion completed successfully!`)
    console.log(`[SEND_TO_CLIENT_API] 🎯 Created program ID: ${programId}`)
    console.log(`[SEND_TO_CLIENT_API] 📍 Program location: /users/${clientUserId}/programs/${programId}`)

    console.log(`[SEND_TO_CLIENT_API] 🏁 === SEND TO CLIENT REQUEST COMPLETED SUCCESSFULLY ===`)

    return NextResponse.json({
      success: true,
      programId,
      message: "Program sent successfully",
      details: {
        clientUserId,
        programId,
        trainerId,
        clientId,
        programTitle: programData.program_title || programData.title || programData.name || "Untitled Program",
      },
    })
  } catch (error) {
    console.error(`[SEND_TO_CLIENT_API] ❌ UNEXPECTED ERROR:`, error)
    console.error(`[SEND_TO_CLIENT_API] ❌ Error details:`, {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 1000),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error: "Failed to send program to client",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
