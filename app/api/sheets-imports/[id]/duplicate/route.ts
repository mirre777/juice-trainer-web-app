import { NextResponse } from "next/server"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const docRef = doc(db, "sheets_imports", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json({ message: "ProgramImport not found" }, { status: 404 })
    }
    const newProgramId = uuidv4()
    await setDoc(doc(db, "sheets_imports", newProgramId), {
      ...docSnap.data(),
      name: "Copy of " + docSnap.data().name,
      id: newProgramId,
    })

    return NextResponse.json({ id: newProgramId, ...docSnap.data() })
  } catch (error) {
    console.error("Error fetching sheets import:", error)
    return NextResponse.json({ message: "Failed to fetch sheets import" }, { status: 500 })
  }
}

