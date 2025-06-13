import { type NextRequest, NextResponse } from "next/server"
import { getDoc, doc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code

    if (!code) {
      return NextResponse.json({ error: "Invitation code is required" }, { status: 400 })
    }

    // Get the invitation document
    const invitationRef = doc(collection(db, "invitations"), code)
    const invitationDoc = await getDoc(invitationRef)

    if (!invitationDoc.exists()) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    const invitationData = invitationDoc.data()

    // Check if the invitation is still valid
    if (invitationData.status !== "pending") {
      return NextResponse.json({ error: "Invitation has already been used" }, { status: 400 })
    }

    if (new Date() > invitationData.expiresAt.toDate()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Get the trainer information
    const trainerRef = doc(collection(db, "users"), invitationData.trainerId)
    const trainerDoc = await getDoc(trainerRef)

    if (!trainerDoc.exists()) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
    }

    const trainerData = trainerDoc.data()

    // Get the client information
    const clientRef = doc(collection(db, "users", invitationData.trainerId, "clients"), invitationData.clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const clientData = clientDoc.data()

    return NextResponse.json({
      success: true,
      invitation: {
        code: invitationData.code,
        status: invitationData.status,
        createdAt: invitationData.createdAt.toDate(),
        expiresAt: invitationData.expiresAt.toDate(),
      },
      trainer: {
        id: trainerDoc.id,
        name: trainerData.name || trainerData.firstName || "Your Trainer",
      },
      client: {
        id: clientDoc.id,
        name: clientData.name,
      },
    })
  } catch (error: any) {
    console.error("Error getting invitation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
