import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { config } from "@/lib/config"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
  measurementId: config.firebase.measurementId,
}

// Initialize Firebase
let app, auth, db, storage

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} catch (error) {
  const appError = handleClientError(error, {
    component: "FirebaseInit",
    operation: "initializeFirebase",
    message: "Failed to initialize Firebase",
    errorType: ErrorType.INITIALIZATION_ERROR,
  })

  console.error("Firebase initialization error:", appError)

  // Create fallbacks to prevent runtime errors
  // These will fail gracefully if used
  app = null as any
  auth = null as any
  db = null as any
  storage = null as any
}

export { app, auth, db, storage }
