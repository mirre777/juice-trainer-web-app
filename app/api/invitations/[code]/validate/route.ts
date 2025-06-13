import { db } from "@/lib/firebase/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const code = params.code
    console.log(`[Validate Invitation] 🔍 Validating code: ${code}`)

    if (!code) {
      return NextResponse.json({ success: false, error: "Invitation code is required" }, { status: 400 })
    }

    // Find trainer with this universal invite code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", code))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[Validate Invitation] ❌ No trainer found with code: ${code}`)
      return NextResponse.json({ success: false, error: "Invalid invitation code" }, { status: 404 })
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id
    const trainerData = trainerDoc.data()

    console.log(`[Validate Invitation] ✅ Found trainer: ${trainerId}`)

    // With universal codes, we always return "Valid Invitation" since we can't track individual acceptance
    return NextResponse.json({
      success: true,
      trainerId: trainerId,
      trainerName: trainerData.name || trainerData.firstName || "Your Trainer",
      status: "Valid Invitation", // Always valid for universal codes
      isValid: true,
    })
  } catch (error: any) {
    console.error("[Validate Invitation] ❌ Error validating invitation:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
