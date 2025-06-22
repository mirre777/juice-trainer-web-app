import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name } = body

    console.log(`[API] Updating sheets import ${id} with name:`, name)

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required and must be a string" }, { status: 400 })
    }

    // Validate that the document exists
    const docRef = doc(db, "sheets_imports", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log(`[API] Document ${id} not found`)
      return NextResponse.json({ error: "Import not found" }, { status: 404 })
    }

    // Update the document with the new name
    await updateDoc(docRef, {
      name: name.trim(),
      updatedAt: new Date(),
    })

    console.log(`[API] Successfully updated sheets import ${id}`)

    return NextResponse.json({
      success: true,
      message: "Program name updated successfully",
      data: { id, name: name.trim() },
    })
  } catch (error) {
    console.error("[API] Error updating sheets import:", error)
    return NextResponse.json({ error: "Failed to update program name" }, { status: 500 })
  }
}
