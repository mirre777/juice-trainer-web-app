export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Starting role debug check...")

    const email = "mirresnelting@gmail.com"

    // Import Firebase
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore")

    const results = {
      timestamp: new Date().toISOString(),
      email: email,
      checks: {},
    }

    // 1. Query by email
    console.log("1. Querying by email...")
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      results.checks.emailQuery = {
        success: true,
        count: querySnapshot.size,
        users: [],
      }

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        results.checks.emailQuery.users.push({
          id: docSnap.id,
          email: data.email,
          role: data.role,
          user_type: data.user_type,
          name: data.name,
          hasFirebaseAuth: data.hasFirebaseAuth,
        })
      })

      console.log("Email query results:", results.checks.emailQuery)
    } catch (error) {
      results.checks.emailQuery = {
        success: false,
        error: error.message,
      }
    }

    // 2. Check all trainers
    console.log("2. Checking all trainers...")
    try {
      const usersRef = collection(db, "users")
      const trainerQuery = query(usersRef, where("role", "==", "trainer"))
      const trainerSnapshot = await getDocs(trainerQuery)

      results.checks.allTrainers = {
        success: true,
        count: trainerSnapshot.size,
        trainers: [],
      }

      trainerSnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        results.checks.allTrainers.trainers.push({
          id: docSnap.id,
          email: data.email,
          role: data.role,
          name: data.name,
        })
      })

      console.log("Trainer query results:", results.checks.allTrainers)
    } catch (error) {
      results.checks.allTrainers = {
        success: false,
        error: error.message,
      }
    }

    // 3. Try direct document access if we found a user
    if (results.checks.emailQuery?.users?.length > 0) {
      const userId = results.checks.emailQuery.users[0].id
      console.log("3. Direct document access for user:", userId)

      try {
        const userDocRef = doc(collection(db, "users"), userId)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          results.checks.directAccess = {
            success: true,
            exists: true,
            data: {
              id: userId,
              email: userData.email,
              role: userData.role,
              user_type: userData.user_type,
              name: userData.name,
              rawRole: JSON.stringify(userData.role),
              roleType: typeof userData.role,
            },
          }
        } else {
          results.checks.directAccess = {
            success: true,
            exists: false,
          }
        }

        console.log("Direct access results:", results.checks.directAccess)
      } catch (error) {
        results.checks.directAccess = {
          success: false,
          error: error.message,
        }
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        error: "Debug check failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
