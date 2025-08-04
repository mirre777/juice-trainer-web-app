import { db } from "@/lib/firebase/firebase"
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  console.log(`[Accept Invitation] 🎯 Processing acceptance for code: ${code}`)

  if (!code) {
    console.log(`[Accept Invitation] ❌ Missing invite code`)
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 })
  }

  try {
    const data = await req.json()
    const { clientInfo } = data

    console.log(`[Accept Invitation] 📝 Client info:`, clientInfo)

    // Find trainer with this universal invite code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", code))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[Accept Invitation] ❌ Invalid invite code: ${code}`)
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id
    const trainerData = trainerDoc.data()

    console.log(`[Accept Invitation] ✅ Found trainer: ${trainerData.name || trainerId}`)

    // Create an invitation acceptance record with regular timestamp
    const now = new Date().toISOString()
    const acceptanceData = {
      inviteCode: code,
      trainerId: trainerId,
      trainerName: trainerData.name || trainerData.firstName || "Unknown Trainer",
      clientInfo: clientInfo,
      status: "accepted",
      acceptedAt: now, // Use regular timestamp instead of serverTimestamp()
      createdAt: now,
    }

    const trainerRef = doc(db, "users", trainerId)

    // Add to accepted invitations array AND set status field
    const currentAcceptedInvitations = trainerData.acceptedInvitations || []
    const newAcceptedInvitations = [...currentAcceptedInvitations, acceptanceData]

    await updateDoc(trainerRef, {
      acceptedInvitations: newAcceptedInvitations,
      lastInviteAcceptedAt: serverTimestamp(), // serverTimestamp() only at top level
      updatedAt: serverTimestamp(),
    })

    console.log(`[Accept Invitation] ✅ Invitation accepted successfully for trainer: ${trainerId}`)

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      trainerId: trainerId,
      trainerName: trainerData.name || trainerData.firstName || "Unknown Trainer",
    })
  } catch (error) {
    console.error("[Accept Invitation] ❌ Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
