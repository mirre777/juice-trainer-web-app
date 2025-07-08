import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getFunctions } from "firebase/functions"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)
const functions = getFunctions(app)

class ProgramConversionService {
  private db: any // Using 'any' type for simplicity, consider a more specific type
  private auth: any
  private storage: any
  private functions: any

  constructor(db: any, auth: any, storage: any, functions: any) {
    this.db = db
    this.auth = auth
    this.storage = storage
    this.functions = functions
  }

  async sendProgramToClient(clientId: string, programData: any) {
    try {
      console.log("🔄 Converting program for client:", clientId)
      console.log("📋 Program data:", programData)

      // Get client information
      const clientDoc = await this.db.collection("clients").doc(clientId).get()
      if (!clientDoc.exists) {
        throw new Error(`Client with ID ${clientId} not found`)
      }

      const clientData = clientDoc.data()
      console.log("👤 Client data:", clientData)

      // Convert the program data to the format expected by the client
      const convertedProgram = {
        id: `program_${Date.now()}`,
        name: programData.name || programData.program_title || "Untitled Program",
        description: programData.description || "",
        duration_weeks: programData.duration_weeks || 1,
        is_periodized: programData.is_periodized || false,
        weeks: programData.weeks || [],
        routines: programData.routines || [],
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        status: "active",
      }

      // Save the program to the client's programs collection
      const programRef = this.db.collection("clients").doc(clientId).collection("programs").doc()
      await programRef.set(convertedProgram)

      console.log("✅ Program saved to client's collection:", programRef.id)

      return {
        programId: programRef.id,
        clientId: clientId,
        clientName: clientData?.name || "Unknown Client",
        programName: convertedProgram.name,
      }
    } catch (error) {
      console.error("❌ Error in sendProgramToClient:", error)
      throw error
    }
  }
}

const programConversionService = new ProgramConversionService(db, auth, storage, functions)

export default programConversionService
