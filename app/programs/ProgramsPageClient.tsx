"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/firebase"
import { collection, getDocs } from "firebase/firestore"

interface Program {
  id: string
  name: string
  description: string
}

const ProgramsPageClient = () => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const programsCollection = collection(db, "programs")
        const programsSnapshot = await getDocs(programsCollection)
        const programsList: Program[] = programsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Program[]
        setPrograms(programsList)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching programs:", error)
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  if (loading) {
    return <div>Loading programs...</div>
  }

  return (
    <div>
      <h1>Programs</h1>
      {programs.length > 0 ? (
        <ul>
          {programs.map((program) => (
            <li key={program.id}>
              <h2>{program.name}</h2>
              <p>{program.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No programs available.</p>
      )}
    </div>
  )
}

export default ProgramsPageClient
