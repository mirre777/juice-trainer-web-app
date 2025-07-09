import { type NextRequest, NextResponse } from "next/server"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { getUserByEmail } from "@/lib/firebase/user-service"

function generateErrorId() {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function logError(errorId: string, context: string, error: any, additionalData?: any) {
  console.error(`[API:login] ❌ ${context} (ID: ${errorId})`)
  console.error(`[API:login] Error type: ${error.constructor.name}`)
  console.error(`[API:login] Error message: ${error.message}`)
  console.error(`[API:login] Error code: ${error.code || "N/A"}`)

  if (error.stack) {
    console.error(`[API:login] Stack trace:`, error.stack)
  }

  if (additionalData) {
    console.error(`[API:login] Additional context:`, JSON.stringify(additionalData, null, 2))
  }

  console.error(`[API:login] Environment: ${process.env.NODE_ENV}`)
  console.error(`[API:login] Vercel: ${process.env.VERCEL === "1" ? "Yes" : "No"}`)
  console.error(`[API:login] Timestamp: ${new Date().toISOString()}`)
}

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()

  try {
    console.log(`[API:login] 🔄 Login attempt started (ID: ${errorId})`)

    let body
    try {
      body = await request.json()
      console.log(`[API:login] ✅ Request body parsed successfully`)
    } catch (parseError) {
      logError(errorId, "Failed to parse request body", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body", errorId }, { status: 400 })
    }

    const { email, password, invitationCode } = body

    if (!email || !password) {
      console.log(`[API:login] ❌ Missing required fields - email: ${!!email}, password: ${!!password}`)
      return NextResponse.json({ error: "Email and password are required", errorId }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log(`[API:login] ❌ Invalid email format: ${email}`)
      return NextResponse.json({ error: "Invalid email format", errorId }, { status: 400 })
    }

    console.log(`[API:login] 📧 Attempting login for email: ${email}`)
    console.log(`[API:login] 🎫 Invitation code: ${invitationCode || "None"}`)

    try {
      if (!auth) {
        throw new Error("Firebase auth instance is not initialized")
      }
      console.log(`[API:login] ✅ Firebase auth instance available`)
      console.log(`[API:login] 🔥 Firebase project: ${auth.app.options.projectId}`)
    } catch (firebaseConfigError) {
      logError(errorId, "Firebase configuration error", firebaseConfigError, {
        hasAuth: !!auth,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "Missing",
      })
      return NextResponse.json({ error: "Authentication service configuration error", errorId }, { status: 500 })
    }

    let userCredential
    try {
      console.log(`[API:login] 🔄 Attempting Firebase authentication...`)
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log(`[API:login] ✅ Firebase authentication successful`)
      console.log(`[API:login] 👤 User ID: ${userCredential.user.uid}`)
    } catch (authError: any) {
      console.log(`[API:login] ❌ Firebase authentication failed`)
      logError(errorId, "Firebase authentication failed", authError, {
        email,
        errorCode: authError.code,
        hasInvitationCode: !!invitationCode,
      })

      switch (authError.code) {
        case "auth/user-not-found":
          return NextResponse.json({ error: "No account found with this email address", errorId }, { status: 404 })
        case "auth/wrong-password":
          return NextResponse.json({ error: "Incorrect password", errorId }, { status: 401 })
        case "auth/invalid-email":
          return NextResponse.json({ error: "Invalid email address", errorId }, { status: 400 })
        case "auth/user-disabled":
          return NextResponse.json({ error: "This account has been disabled", errorId }, { status: 403 })
        case "auth/too-many-requests":
          return NextResponse.json(
            { error: "Too many failed login attempts. Please try again later.", errorId },
            { status: 429 },
          )
        case "auth/network-request-failed":
          return NextResponse.json(
            { error: "Network error. Please check your connection and try again.", errorId },
            { status: 503 },
          )
        default:
          return NextResponse.json({ error: "Authentication failed. Please try again.", errorId }, { status: 401 })
      }
    }

    let userData
    try {
      console.log(`[API:login] 🔄 Fetching user data from Firestore...`)
      userData = await getUserByEmail(email)

      if (!userData) {
        console.log(`[API:login] ❌ User data not found in Firestore for email: ${email}`)
        return NextResponse.json({ error: "User profile not found. Please contact support.", errorId }, { status: 404 })
      }

      console.log(`[API:login] ✅ User data retrieved from Firestore`)
      console.log(`[API:login] 👤 User role: ${userData.role || "Not set"}`)
    } catch (firestoreError) {
      logError(errorId, "Failed to fetch user data from Firestore", firestoreError, {
        email,
        userId: userCredential.user.uid,
      })
      return NextResponse.json(
        { error: "Failed to retrieve user profile. Please try again.", errorId },
        { status: 500 },
      )
    }

    console.log(`[API:login] 🎉 Login successful for user: ${email}`)
    console.log(`[API:login] 🍪 Setting simple user_id cookie...`)

    const response = NextResponse.json({
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData.role || "user",
      },
    })

    // Simple cookie approach - just store the user ID
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    // Set the user_id cookie (primary)
    response.cookies.set("user_id", userCredential.user.uid, cookieOptions)

    console.log(`[API:login] ✅ Cookie set successfully:`)
    console.log(`[API:login] - user_id: ${userCredential.user.uid}`)

    return response
  } catch (error: any) {
    logError(errorId, "Unexpected error in login route", error, {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    })

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return NextResponse.json({ error: "Network connectivity issue. Please try again.", errorId }, { status: 503 })
    }

    if (error.name === "TimeoutError" || error.message.includes("timeout")) {
      return NextResponse.json({ error: "Request timeout. Please try again.", errorId }, { status: 408 })
    }

    if (error.message.includes("Firebase") || error.message.includes("auth")) {
      return NextResponse.json(
        { error: "Authentication service error. Please try again later.", errorId },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        errorId,
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            message: error.message,
            type: error.constructor.name,
          },
        }),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "Login endpoint - use POST method" }, { status: 405 })
}
