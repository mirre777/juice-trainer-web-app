import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"
import { db } from "@/lib/firebase/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

function generateErrorId() {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET(request: NextRequest) {
  const errorId = generateErrorId()

  try {
    console.log(`[API:me] 🔄 Starting user profile fetch (${errorId})`)

    // Get token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log(`[API:me] ❌ No auth token found`)
      return NextResponse.json({ error: "No authentication token", errorId }, { status: 401 })
    }

    console.log(`[API:me] 🔑 Token found: ${token.substring(0, 20)}...`)

    // Verify token
    let tokenData
    try {
      tokenData = await verifyToken(token)
      console.log(`[API:me] ✅ Token verified:`, {
        email: tokenData.email,
        uid: tokenData.uid,
        role: tokenData.role,
      })
    } catch (tokenError: any) {
      console.log(`[API:me] ❌ Token verification failed:`, tokenError.message)
      return NextResponse.json({ error: "Invalid token", errorId }, { status: 401 })
    }

    // Try to find user in Firestore with multiple email variants
    let userProfile = null
    const emailsToTry = [
      tokenData.email, // Original email from token
      tokenData.email.replace("+4@", "@"), // Remove +4 if present
      tokenData.email.replace("@", "+4@"), // Add +4 if not present
    ]

    console.log(`[API:me] 🔍 Searching for user with emails:`, emailsToTry)

    try {
      for (const emailToTry of emailsToTry) {
        console.log(`[API:me] 🔍 Trying email: ${emailToTry}`)

        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", emailToTry))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          const userData = userDoc.data()

          userProfile = {
            uid: userDoc.id,
            email: userData.email,
            name: userData.name || "",
            role: userData.role || "user",
            user_type: userData.user_type,
            hasFirebaseAuth: userData.hasFirebaseAuth,
            profilePicture: userData.profilePicture,
            isApproved: userData.isApproved,
            subscriptionStatus: userData.subscriptionStatus,
          }

          console.log(`[API:me] ✅ User found with email ${emailToTry}:`, {
            uid: userProfile.uid,
            email: userProfile.email,
            role: userProfile.role,
            name: userProfile.name,
          })
          break
        }
      }

      if (!userProfile) {
        console.log(`[API:me] ❌ User not found with any email variant`)

        // As a fallback, try to find by UID if available
        if (tokenData.uid) {
          console.log(`[API:me] 🔍 Trying to find user by UID: ${tokenData.uid}`)

          const userDocRef = doc(db, "users", tokenData.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            userProfile = {
              uid: userDoc.id,
              email: userData.email,
              name: userData.name || "",
              role: userData.role || "user",
              user_type: userData.user_type,
              hasFirebaseAuth: userData.hasFirebaseAuth,
              profilePicture: userData.profilePicture,
              isApproved: userData.isApproved,
              subscriptionStatus: userData.subscriptionStatus,
            }
            console.log(`[API:me] ✅ User found by UID:`, {
              uid: userProfile.uid,
              email: userProfile.email,
              role: userProfile.role,
            })
          }
        }
      }

      if (!userProfile) {
        console.log(`[API:me] ❌ User profile not found anywhere`)
        return NextResponse.json(
          {
            error: "User profile not found",
            errorId,
            debug: {
              tokenEmail: tokenData.email,
              tokenUid: tokenData.uid,
              emailsSearched: emailsToTry,
            },
          },
          { status: 404 },
        )
      }
    } catch (firestoreError: any) {
      console.error(`[API:me] ❌ Firestore error:`, firestoreError)
      return NextResponse.json({ error: "Database error", errorId, details: firestoreError.message }, { status: 500 })
    }

    // Return user data
    const response = {
      user: userProfile,
    }

    console.log(`[API:me] 🎉 Returning user data:`, {
      email: response.user.email,
      role: response.user.role,
      uid: response.user.uid,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[API:me] ❌ Unexpected error (${errorId}):`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        errorId,
        details: error.message,
      },
      { status: 500 },
    )
  }
}
