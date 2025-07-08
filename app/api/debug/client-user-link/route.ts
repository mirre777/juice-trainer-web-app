import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get("trainerId") || "5tVdK6LXCifZgjxD7rml3nEOXmh1"
    const clientId = searchParams.get("clientId") || "CGLJmpv59IngpsYpW7PZ"

    console.log(`[DEBUG] === CLIENT-USER LINK DIAGNOSIS ===`)
    console.log(`[DEBUG] Timestamp: ${new Date().toISOString()}`)
    console.log(`[DEBUG] Trainer ID: ${trainerId}`)
    console.log(`[DEBUG] Client ID: ${clientId}`)

    const result = {
      timestamp: new Date().toISOString(),
      trainerId,
      clientId,
      client: null,
      user: null,
      canSendProgram: false,
      issues: [],
      recommendations: [],
      paths: {
        client: `users/${trainerId}/clients/${clientId}`,
        user: null,
      },
      timing: {
        start: startTime,
        clientFetch: null,
        userFetch: null,
        total: null,
      },
    }

    // Step 1: Get client document
    console.log(`[DEBUG] Step 1: Fetching client document...`)
    const clientFetchStart = Date.now()

    const clientRef = doc(db, "users", trainerId, "clients", clientId)
    const clientDoc = await getDoc(clientRef)

    result.timing.clientFetch = Date.now() - clientFetchStart
    console.log(`[DEBUG] Client fetch took: ${result.timing.clientFetch}ms`)

    if (!clientDoc.exists()) {
      console.log(`[DEBUG] ❌ Client document not found`)
      result.issues.push("Client document does not exist")
      result.recommendations.push("Verify client ID is correct")
      result.timing.total = Date.now() - startTime

      return NextResponse.json(result, { status: 404 })
    }

    const clientData = clientDoc.data()
    console.log(`[DEBUG] ✅ Client document found`)
    console.log(`[DEBUG] Client data keys:`, Object.keys(clientData))
    console.log(`[DEBUG] Client name: ${clientData.name}`)
    console.log(`[DEBUG] Client email: ${clientData.email}`)
    console.log(`[DEBUG] Client userId: ${clientData.userId || "MISSING"}`)
    console.log(`[DEBUG] Client status: ${clientData.status}`)

    result.client = {
      id: clientId,
      name: clientData.name,
      email: clientData.email,
      status: clientData.status,
      userId: clientData.userId || null,
      isTemporary: clientData.isTemporary,
      createdAt: clientData.createdAt,
      updatedAt: clientData.updatedAt,
      hasUserId: !!clientData.userId,
    }

    // Step 2: Check user document if userId exists
    if (clientData.userId) {
      console.log(`[DEBUG] Step 2: Checking user document...`)
      result.paths.user = `users/${clientData.userId}`

      const userFetchStart = Date.now()
      const userRef = doc(db, "users", clientData.userId)
      const userDoc = await getDoc(userRef)
      result.timing.userFetch = Date.now() - userFetchStart

      console.log(`[DEBUG] User fetch took: ${result.timing.userFetch}ms`)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log(`[DEBUG] ✅ User document found`)
        console.log(`[DEBUG] User data keys:`, Object.keys(userData))
        console.log(`[DEBUG] User name: ${userData.name}`)
        console.log(`[DEBUG] User email: ${userData.email}`)
        console.log(`[DEBUG] User status: ${userData.status}`)
        console.log(`[DEBUG] User trainers:`, userData.trainers || [])

        result.user = {
          id: clientData.userId,
          name: userData.name,
          email: userData.email,
          status: userData.status,
          trainers: userData.trainers || [],
          createdAt: userData.createdAt,
          linkedAt: userData.linkedAt,
          hasTrainers: !!(userData.trainers && userData.trainers.length > 0),
        }

        // Check if trainer is in user's trainers array
        if (userData.trainers && Array.isArray(userData.trainers)) {
          if (userData.trainers.includes(trainerId)) {
            console.log(`[DEBUG] ✅ Trainer found in user's trainers array`)
            result.canSendProgram = true
          } else {
            console.log(`[DEBUG] ❌ Trainer NOT in user's trainers array`)
            result.issues.push("Trainer not in user's trainers array")
            result.recommendations.push("Add trainer to user's trainers array")
          }
        } else {
          console.log(`[DEBUG] ❌ User has no trainers array`)
          result.issues.push("User has no trainers array")
          result.recommendations.push("Initialize user's trainers array with current trainer")
        }

        // Email verification
        if (clientData.email && userData.email) {
          if (clientData.email === userData.email) {
            console.log(`[DEBUG] ✅ Client and user emails match`)
          } else {
            console.log(`[DEBUG] ⚠️ Client and user emails don't match`)
            result.issues.push(`Email mismatch: client(${clientData.email}) vs user(${userData.email})`)
          }
        } else {
          console.log(`[DEBUG] ⚠️ Missing email data`)
          result.issues.push("Missing email data in client or user document")
        }
      } else {
        console.log(`[DEBUG] ❌ User document does not exist`)
        result.issues.push(`User document does not exist at users/${clientData.userId}`)
        result.recommendations.push("Create user document or update client userId")
      }
    } else {
      console.log(`[DEBUG] Step 2: Client has no userId - searching by email...`)
      result.issues.push("Client document missing userId field")

      if (clientData.email) {
        try {
          const usersRef = collection(db, "users")
          const emailQuery = query(usersRef, where("email", "==", clientData.email))
          const emailSnapshot = await getDocs(emailQuery)

          console.log(`[DEBUG] Email search found ${emailSnapshot.size} users`)

          if (!emailSnapshot.empty) {
            const foundUsers = []
            emailSnapshot.forEach((doc) => {
              const userData = doc.data()
              foundUsers.push({
                id: doc.id,
                name: userData.name,
                email: userData.email,
                status: userData.status,
                trainers: userData.trainers || [],
              })
            })

            result.recommendations.push(`Link client to user: ${foundUsers[0].id}`)
            console.log(
              `[DEBUG] Found potential users:`,
              foundUsers.map((u) => u.id),
            )
          } else {
            console.log(`[DEBUG] No users found with email: ${clientData.email}`)
            result.recommendations.push("Create user account or verify email address")
          }
        } catch (emailError) {
          console.log(`[DEBUG] Error searching by email:`, emailError.message)
          result.issues.push(`Error searching users by email: ${emailError.message}`)
        }
      } else {
        result.issues.push("Client has no email to search by")
      }
    }

    result.timing.total = Date.now() - startTime
    console.log(`[DEBUG] Total request time: ${result.timing.total}ms`)
    console.log(`[DEBUG] Can send program: ${result.canSendProgram}`)
    console.log(`[DEBUG] Issues found: ${result.issues.length}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[DEBUG] Error in client-user link diagnosis:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
