import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"
import { db } from "@/lib/firebase/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

function generateErrorId() {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function extractStringValue(value: any): string | null {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && value.uid) return value.uid
  if (value && typeof value === "object" && value.email) return value.email
  return null
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
      console.log(`[API:me] ✅ Token verified successfully`)
      console.log(`[API:me] 🔍 Token data type:`, typeof tokenData, Array.isArray(tokenData))
      console.log(`[API:me] 🔍 Token data structure:`, JSON.stringify(tokenData, null, 2))
    } catch (tokenError: any) {
      console.log(`[API:me] ❌ Token verification failed:`, tokenError.message)
      return NextResponse.json({ error: "Invalid token", errorId, details: tokenError.message }, { status: 401 })
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
      console.log(`[API:me] 📋 Token data is array with length:`, tokenData.length)
      userData = tokenData[0]
      console.log(`[API:me] 📋 Using first array element:`, userData)
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

    // Extract data from userData with better handling
    const rawEmail = userData.email
    const rawUid = userData.uid
    const rawRole = userData.role

    console.log(`[API:me] 📋 Raw extracted data:`, {
      rawEmail,
      rawUid,
      rawRole,
      emailType: typeof rawEmail,
      uidType: typeof rawUid,
      roleType: typeof rawRole,
    })

    // Convert to strings safely
    const email = extractStringValue(rawEmail)
    const uid = extractStringValue(rawUid)
    const role = typeof rawRole === "string" ? rawRole : null

    console.log(`[API:me] 📋 Processed data:`, { email, uid, role })

    if (!email && !uid) {
      console.log(`[API:me] ❌ No email or uid found in user data`)
      return NextResponse.json(
        {
          error: "Invalid token data - missing email/uid",
          errorId,
          debug: {
            tokenData,
            userData,
            rawEmail,
            rawUid,
            processedEmail: email,
            processedUid: uid,
          },
        },
        { status: 401 },
      )
    }

    // Try to find user in Firestore - simplified approach
    let userProfile = null

    try {
      console.log(`[API:me] 🔍 Starting Firestore search...`)

      // Try by UID first (most direct, no index needed)
      if (uid && typeof uid === "string") {
        console.log(`[API:me] 🔍 Searching by UID: ${uid}`)

        try {
          const userDocRef = doc(db, "users", uid)
          console.log(`[API:me] 🔍 Getting document by UID...`)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log(`[API:me] 📄 Raw user document data from UID:`, userData)

            userProfile = {
              uid: userDoc.id,
              email: userData.email || "",
              name: userData.name || "",
              role: userData.role || "user",
              user_type: userData.user_type || "",
              hasFirebaseAuth: userData.hasFirebaseAuth || false,
              profilePicture: userData.profilePicture || "",
              isApproved: userData.isApproved || false,
              subscriptionStatus: userData.subscriptionStatus || "",
            }
            console.log(`[API:me] ✅ User found by UID:`, {
              uid: userProfile.uid,
              email: userProfile.email,
              role: userProfile.role,
            })
          } else {
            console.log(`[API:me] ❌ No user document found with UID: ${uid}`)
          }
        } catch (uidError: any) {
          console.error(`[API:me] ❌ Error querying UID ${uid}:`, uidError)
          throw uidError
        }
      } else {
        console.log(`[API:me] ⚠️ UID is not a valid string:`, typeof uid, uid)
      }

      // If not found by UID, try by email
      if (!userProfile && email && typeof email === "string") {
        console.log(`[API:me] 🔍 Searching by email: ${email}`)

        const emailsToTry = [email]

        // Add email variants safely
        try {
          if (email.includes("+4@")) {
            emailsToTry.push(email.replace("+4@", "@"))
          } else if (email.includes("@") && !email.includes("+")) {
            emailsToTry.push(email.replace("@", "+4@"))
          }
        } catch (emailError: any) {
          console.log(`[API:me] ⚠️ Error creating email variants:`, emailError.message)
        }

        console.log(`[API:me] 🔍 Email variants to try:`, emailsToTry)

        for (const emailToTry of emailsToTry) {
          console.log(`[API:me] 🔍 Querying Firestore for email: ${emailToTry}`)

          try {
            const usersRef = collection(db, "users")
            const q = query(usersRef, where("email", "==", emailToTry))

            console.log(`[API:me] 🔍 Executing Firestore query...`)
            const querySnapshot = await getDocs(q)

            console.log(`[API:me] 🔍 Query completed, found ${querySnapshot.size} documents`)

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              const userData = userDoc.data()

              console.log(`[API:me] 📄 Raw user document data:`, userData)

              userProfile = {
                uid: userDoc.id,
                email: userData.email || "",
                name: userData.name || "",
                role: userData.role || "user",
                user_type: userData.user_type || "",
                hasFirebaseAuth: userData.hasFirebaseAuth || false,
                profilePicture: userData.profilePicture || "",
                isApproved: userData.isApproved || false,
                subscriptionStatus: userData.subscriptionStatus || "",
              }

              console.log(`[API:me] ✅ User found with email ${emailToTry}:`, {
                uid: userProfile.uid,
                email: userProfile.email,
                role: userProfile.role,
              })
              break
            } else {
              console.log(`[API:me] ❌ No user found with email: ${emailToTry}`)
            }
          } catch (queryError: any) {
            console.error(`[API:me] ❌ Error querying email ${emailToTry}:`, queryError)
            console.error(`[API:me] ❌ This might be an index issue. Error details:`, queryError.message)
            // Don't throw here, continue to next email variant
          }
        }
      } else {
        console.log(`[API:me] ⚠️ Email is not a valid string:`, typeof email, email)
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
              searchedByUid: !!uid,
              searchedByEmail: !!email,
              rawData: { rawEmail, rawUid, rawRole },
            },
          },
          { status: 404 },
        )
      }
    } catch (firestoreError: any) {
      console.error(`[API:me] ❌ Firestore error:`, firestoreError)
      console.error(`[API:me] ❌ Error stack:`, firestoreError.stack)
      return NextResponse.json(
        {
          error: "Database error",
          errorId,
          details: firestoreError.message,
          stack: process.env.NODE_ENV === "development" ? firestoreError.stack : undefined,
        },
        { status: 500 },
      )
    }

    // Return user data
    const response = {
      user: userProfile,
    }

    console.log(`[API:me] 🎉 Successfully returning user data:`, {
      email: response.user.email,
      role: response.user.role,
      uid: response.user.uid,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[API:me] ❌ Unexpected error (${errorId}):`, error)
    console.error(`[API:me] ❌ Error stack:`, error.stack)
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
