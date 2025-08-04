import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const docRef = doc(db, "sheets_imports", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json({ message: "Import not found" }, { status: 404 })
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() })
  } catch (error) {
    console.error("Error fetching sheets import:", error)
    return NextResponse.json({ message: "Failed to fetch sheets import" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const docRef = doc(db, "sheets_imports", id)

    // Only allow updating 'name' and 'status' for now
    const updateData: { name?: string; status?: string } = {}
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.program !== undefined) {
      updateData.program = body.program
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 })
    }

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date(), // Update timestamp
    })

    const updatedDocSnap = await getDoc(docRef)
    return NextResponse.json({ message: "Import updated successfully", data: updatedDocSnap.data() })
  } catch (error) {
    console.error("Error updating sheets import:", error)
    return NextResponse.json({ message: "Failed to update sheets import" }, { status: 500 })
  }
}
