import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || "mirresnelting@gmail.com"

    console.log(`[CHECK-USER] Checking user: ${email}`)

    const { db } = await import("@/lib/firebase/firebase")
    const { collection, query, where, getDocs } = await import("firebase/firestore")

    const usersRef = collection(db, "users")
    const userQuery = query(usersRef, where("email", "==", email))
    const snapshot = await getDocs(userQuery)

    if (snapshot.empty) {
      // Also try with +4 variant
      const altEmail = email.replace("@", "+4@")
      console.log(`[CHECK-USER] Trying alternative email: ${altEmail}`)

      const altQuery = query(usersRef, where("email", "==", altEmail))
      const altSnapshot = await getDocs(altQuery)

      if (altSnapshot.empty) {
        return NextResponse.json({
          found: false,
          message: `No user found with email: ${email} or ${altEmail}`,
          searchedEmails: [email, altEmail],
        })
      }

      const altUserDoc = altSnapshot.docs[0]
      const altUserData = altUserDoc.data()

      return NextResponse.json({
        found: true,
        message: `User found with alternative email: ${altEmail}`,
        user: {
          id: altUserDoc.id,
          email: altUserData.email,
          name: altUserData.name,
          role: altUserData.role,
          user_type: altUserData.user_type,
          hasFirebaseAuth: altUserData.hasFirebaseAuth,
          createdAt: altUserData.createdAt?.toDate?.()?.toISOString(),
        },
        searchedEmails: [email, altEmail],
      })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    console.log(`[CHECK-USER] User found:`, {
      id: userDoc.id,
      email: userData.email,
      role: userData.role,
    })

    return NextResponse.json({
      found: true,
      message: `User found with email: ${email}`,
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        user_type: userData.user_type,
        hasFirebaseAuth: userData.hasFirebaseAuth,
        createdAt: userData.createdAt?.toDate?.()?.toISOString(),
        updatedAt: userData.updatedAt?.toDate?.()?.toISOString(),
      },
      searchedEmails: [email],
    })
  } catch (error: any) {
    console.error("[CHECK-USER] Error checking user:", error)
    return NextResponse.json(
      {
        error: "Failed to check user",
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
