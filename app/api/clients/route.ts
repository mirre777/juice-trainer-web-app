import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/firebase/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const trainerId = cookieStore.get("user_id")?.value

    if (!trainerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Query the clients collection for this trainer
    const clientsRef = collection(db, `users/${trainerId}/clients`)
    const clientsQuery = query(clientsRef, where("deleted", "!=", true), orderBy("name", "asc"))

    const snapshot = await getDocs(clientsQuery)
    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
