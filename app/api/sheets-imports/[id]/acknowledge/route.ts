import { NextResponse } from "next/server"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const docRef = doc(db, "sheets_imports", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json({ message: "ProgramImport not found" }, { status: 404 })
    }
    // update only acknowledgedAt and updatedAt
    await setDoc(doc(db, "sheets_imports", id), {
      ...docSnap.data(),
      acknowledgedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ id: id, acknowledgedAt: serverTimestamp() })
  } catch (error) {
    console.error("Error fetching sheets import:", error)
    return NextResponse.json({ message: "Failed to fetch sheets import" }, { status: 500 })
  }
}

