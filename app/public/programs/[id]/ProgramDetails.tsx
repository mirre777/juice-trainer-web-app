"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ProgramWithRoutines } from "@/lib/firebase/global-programs/types"
import Image from "next/image"

interface ProgramDetailsProps {
  programId: string
}

export function ProgramDetails({ programId }: ProgramDetailsProps) {
  const [program, setProgram] = useState<ProgramWithRoutines | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true)
        // This would be your API endpoint to fetch program details
        const response = await fetch(`/api/programs/${programId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("Program not found")
          } else {
            setError("Failed to load program")
          }
          return
        }

        const data = await response.json()
        if (data.success) {
          setProgram(data.program)
        } else {
          setError(data.error || "Failed to load program")
        }
      } catch (err) {
        setError("An error occurred while loading the program")
        console.error("Error fetching program:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgram()
  }, [programId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading program...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Program Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.history.back()}
            className="bg-lime-500 hover:bg-lime-600 text-white font-medium px-6 py-3 rounded-lg"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Program Not Found</h1>
          <p className="text-gray-600">The program you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Juice Logo */}
      <div className="text-center mb-8">
        <Image src="/images/logo.svg" alt="Juice Logo" width={66} height={100} />
        <h1 className="text-xl font-medium text-gray-900">juice</h1>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Program Title and Description */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{program.name}</h2>
          {program.description && (
            <p className="text-gray-600 leading-relaxed">{program.description}</p>
          )}
        </div>

        {/* Routine Sections */}
        <div className="space-y-4 mb-8">
          {program.routines.sort((a, b) => a.order - b.order).map((routine, index) => {
            const routineWithExercises = routine as any;
            return (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {routineWithExercises.name || `Routine ${index + 1}`}
                  </h3>
                  <span className="text-gray-600 text-sm">
                    {routineWithExercises.exercises?.length || 0} exercises
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-gray-700 mb-2 text-sm">
            You can use this program for free in our Juice app workout tracker.
          </p>
          <Button className="w-full bg-[#D2FF28] hover:bg-[#B8E624] text-gray-900 font-medium py-4 px-6 rounded-lg text-lg" onClick={() => {
            window.location.href = `/public/client-signup?source=program&programId=${programId}`
          }}>
            Get Program
          </Button>
        </div>
      </div>
    </div>
  )
}
