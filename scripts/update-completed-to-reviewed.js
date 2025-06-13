// Script to update existing "completed" status imports to "reviewed" status
import { initializeApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"

// Firebase config (using environment variables)
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

async function updateCompletedToReviewed() {
  try {
    console.log('🔍 Searching for imports with "completed" status...')

    // Query for all documents with status "completed"
    const q = query(collection(db, "sheets_imports"), where("status", "==", "completed"))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log('✅ No imports found with "completed" status')
      return
    }

    console.log(`📋 Found ${querySnapshot.size} imports with "completed" status`)

    const updatePromises = []
    const updatedImports = []

    querySnapshot.forEach((docSnapshot) => {
      const importData = docSnapshot.data()
      const importId = docSnapshot.id

      console.log(`📝 Preparing to update import: ${importId}`)
      console.log(`   - Name: ${importData.name || importData.programName || "Untitled"}`)
      console.log(`   - Current status: ${importData.status}`)
      console.log(`   - User ID: ${importData.userId}`)

      // Prepare the update
      const updatePromise = updateDoc(doc(db, "sheets_imports", importId), {
        status: "reviewed",
        updatedAt: new Date(),
      })

      updatePromises.push(updatePromise)
      updatedImports.push({
        id: importId,
        name: importData.name || importData.programName || "Untitled",
        userId: importData.userId,
      })
    })

    console.log("🚀 Updating all imports...")

    // Execute all updates
    await Promise.all(updatePromises)

    console.log("✅ Successfully updated all imports!")
    console.log("\n📊 Summary of updated imports:")
    updatedImports.forEach((imp, index) => {
      console.log(`   ${index + 1}. ${imp.name} (ID: ${imp.id})`)
    })

    console.log(`\n🎉 Total updated: ${updatedImports.length} imports`)
    console.log('💡 These imports now have "reviewed" status and will show "Edit" buttons')
  } catch (error) {
    console.error("❌ Error updating imports:", error)
    throw error
  }
}

// Run the update
updateCompletedToReviewed()
  .then(() => {
    console.log("\n✨ Migration completed successfully!")
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error)
  })
