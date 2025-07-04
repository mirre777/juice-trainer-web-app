"use client"

import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"

interface UserData {
  displayName: string | null
  email: string | null
  photoURL: string | null
  // Add other user data fields as needed
}

const useClientDataHybrid = () => {
  const [user] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setUserData(null)
      setLoading(false)
      return
    }

    const userDocRef = doc(db, "users", user.uid)

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as UserData
          setUserData(data)
          setLoading(false)
        } else {
          // Document doesn't exist, handle accordingly
          console.warn("No such document!")
          setUserData({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          })
          setLoading(false)
        }
      },
      (error) => {
        console.error("Error getting document:", error)
        setError(error)
        setLoading(false)
      },
    )

    return () => unsubscribe() // Cleanup subscription on unmount
  }, [user])

  return { user, userData, loading, error }
}

export default useClientDataHybrid
