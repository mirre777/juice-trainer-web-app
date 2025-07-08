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
      console.log(`[API:me] ✅ Token verified, full data:`, tokenData)
      console.log(`[API:me] 🔍 Token data type:`, typeof tokenData, Array.isArray(tokenData))
    } catch (tokenError: any) {
      console.log(`[API:me] ❌ Token verification failed:`, tokenError.message)
      return NextResponse.json({ error: "Invalid token", errorId }, { status: 401 })
    }

    if (!tokenData) {
      console.log(`[API:me] ❌ Token data is null`)
      return NextResponse.json(
        {
          error: "Invalid token data - null",
          errorId,
        },
        { status: 401 },
      )
    }

    // Handle array response from token verification
    let userData
    if (Array.isArray(tokenData)) {
      console.log(`[API:me] 📋 Token data is array, taking first element`)
      userData = tokenData[0]
    } else {
      console.log(`[API:me] 📋 Token data is object`)
      userData = tokenData
    }

    if (!userData) {
      console.log(`[API:me] ❌ No user data found in token`)
      return NextResponse.json(
        {
          error: "Invalid token data - no user data",
          errorId,
          debug: { tokenData },
        },
        { status: 401 },
      )
    }

    // Extract data from userData
    const email = userData.email
    const uid = userData.uid
    const role = userData.role

    console.log(`[API:me] 📋 Extracted data:`, { email, uid, role })

    if (!email && !uid) {
      console.log(`[API:me] ❌ No email or uid found in user data`)
      return NextResponse.json(
        {
          error: "Invalid token data - missing email/uid",
          errorId,
          debug: { tokenData, userData },
        },
        { status: 401 },
      )
    }

    // Try to find user in Firestore
    let userProfile = null

    try {
      // First try by email if available
      if (email) {
        const emailsToTry = [email]

        // Add email variants
        if (email.includes("+4@")) {
          emailsToTry.push(email.replace("+4@", "@"))
        } else if (email.includes("@") && !email.includes("+")) {
          emailsToTry.push(email.replace("@", "+4@"))
        }

        console.log(`[API:me] 🔍 Searching for user with emails:`, emailsToTry)

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
            })
            break
          }
        }
      }

      // If not found by email, try by UID
      if (!userProfile && uid) {
        console.log(`[API:me] 🔍 Trying to find user by UID: ${uid}`)

        const userDocRef = doc(db, "users", uid)
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

      if (!userProfile) {
        console.log(`[API:me] ❌ User profile not found anywhere`)
        return NextResponse.json(
          {
            error: "User profile not found",
            errorId,
            debug: {
              tokenEmail: email,
              tokenUid: uid,
              tokenRole: role,
            },
          },
          { status: 404 },
        )
      }
    } catch (firestoreError: any) {
      console.error(`[API:me] ❌ Firestore error:`, firestoreError)
      return NextResponse.json(
        {
          error: "Database error",
          errorId,
          details: firestoreError.message,
        },
        { status: 500 },
      )
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
