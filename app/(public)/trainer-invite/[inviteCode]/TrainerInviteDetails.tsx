"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface InvitationResponse {
  trainerId: string
  trainerName: string
}

interface TrainerInviteDetailsProps {
  inviteCode: string
}

export function TrainerInviteDetails({ inviteCode }: TrainerInviteDetailsProps) {
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const renderCheckmark = () => (
    <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )

  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        setLoading(true)
        // Use the invitations API endpoint to get trainer details
        const response = await fetch(`/api/invitations/${inviteCode}/validate`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("Trainer invite not found")
          } else {
            setError("Failed to load trainer invite")
          }
          return
        }

        const data = await response.json()
        if (data.success) {
          setInvitation(data)
        } else {
          setError(data.error || "Failed to load trainer invite")
        }
      } catch (err) {
        setError("An error occurred while loading the trainer invite")
        console.error("Error fetching trainer invite:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainer()
  }, [inviteCode])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading trainer invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trainer Invite Not Found</h1>
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

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trainer Invite Not Found</h1>
          <p className="text-gray-600">The trainer invite you're looking for doesn't exist.</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect with {invitation.trainerName}</h2>
            <p className="text-gray-600 leading-relaxed">Let your trainer see your sessions and guide your next steps.</p>
        </div>

        {/* Features List */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-[#D2FF28] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              {renderCheckmark()}
            </div>
            <span className="text-gray-600 text-sm">Personalised workout plans</span>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-[#D2FF28] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              {renderCheckmark()}
            </div>
            <span className="text-gray-600 text-sm">Track real progress</span>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-[#D2FF28] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              {renderCheckmark()}
            </div>
            <span className="text-gray-600 text-sm">Faster, smarter feedback</span>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-[#D2FF28] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              {renderCheckmark()}
            </div>
            <span className="text-gray-600 text-sm">Guidance and motivation</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button className="w-full bg-[#D2FF28] hover:bg-[#B8E624] text-gray-900 font-medium py-4 px-6 rounded-lg text-lg" onClick={() => {
            window.location.href = `/client-signup?source=trainer-invite&inviteCode=${inviteCode}&trainerName=${invitation.trainerName}`
          }}>
            Sign Up and Connect
          </Button>
        </div>
      </div>
    </div>
  )
}
