"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface InviteClientPageProps {
  code: string
  trainerName?: string
}

export default function InviteClientPage({ code, trainerName }: InviteClientPageProps) {
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [isAlreadyAccepted, setIsAlreadyAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [trainerInfo, setTrainerInfo] = useState<{ name: string; id: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log(`[InviteClientPage] 🔍 Checking invitation code: "${code}"`)

    if (!code) {
      console.error("[InviteClientPage] ❌ No invitation code provided")
      setIsValidating(false)
      setIsValid(false)
      setError("Invalid invitation code")
      setDebugInfo("Code parameter = not provided")
      return
    }

    async function validateInvitation() {
      try {
        console.log(`[InviteClientPage] 🔍 Validating invitation code via API: "${code}"`)
        const validationUrl = `/api/invitations/${code}/validate`
        console.log(`[InviteClientPage] 📡 Validation URL: ${validationUrl}`)

        const response = await fetch(validationUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        const data = await response.json()
        console.log(`[InviteClientPage] 📨 Validation response:`, data)

        if (data.success) {
          console.log(`[InviteClientPage] ✅ Invitation validated successfully: ${code}`)
          setIsValid(true)
          setTrainerInfo({
            name: data.trainerName || "Your Trainer",
            id: data.trainerId,
          })

          // Check if the invitation has already been accepted
          if (data.status === "Accepted Invitation" || data.status === "Active") {
            console.log(`[InviteClientPage] ℹ️ Invitation already accepted: ${code}`)
            setIsAlreadyAccepted(true)
          }
        } else {
          console.error(`[InviteClientPage] ❌ Invalid invitation:`, data.error)
          setError("Invalid invitation code")
          setDebugInfo(data.error || "Unknown validation error")
        }
      } catch (error) {
        console.error("[InviteClientPage] ❌ Error validating invitation:", error)
        setError("Error validating invitation")
        setDebugInfo(error instanceof Error ? error.message : "Unknown error")
      } finally {
        setIsValidating(false)
      }
    }

    validateInvitation()
  }, [code])

  const handleAcceptInvitation = async () => {
    try {
      setIsAccepting(true)
      console.log(`[InviteClientPage] 🎫 Accepting invitation: ${code}`)

      // First, call the accept API to update status
      console.log(`[InviteClientPage] 📡 Calling accept API...`)
      const response = await fetch(`/api/invitations/${code}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientInfo: {
            acceptedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        }),
      })

      const data = await response.json()
      console.log("[InviteClientPage] 📨 Accept response:", data)

      if (data.success) {
        console.log("[InviteClientPage] ✅ Invitation accepted successfully")

        // Now redirect to external client app
        console.log("[InviteClientPage] 🔄 Redirecting to external client app")
        window.location.href = `https://app.juice.fitness/signup?code=${code}${trainerInfo?.name ? `&tn=${encodeURIComponent(trainerInfo.name)}` : ""}`
      } else {
        console.error("[InviteClientPage] ❌ Error accepting invitation:", data.error)
        setError("Error accepting invitation: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("[InviteClientPage] ❌ Error accepting invitation:", error)
      setError("Error accepting invitation: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsAccepting(false)
    }
  }

  const handleExistingAccount = () => {
    console.log("[InviteClientPage] 👤 User has existing account, redirecting to login")
    window.location.href = `https://app.juice.fitness/login?code=${code}${trainerInfo?.name ? `&tn=${encodeURIComponent(trainerInfo.name)}` : ""}`
  }

  const handleContinueToSignup = () => {
    console.log("[InviteClientPage] 🔄 Continuing to signup with already accepted invitation")
    window.location.href = `https://app.juice.fitness/signup?code=${code}${trainerInfo?.name ? `&tn=${encodeURIComponent(trainerInfo.name)}` : ""}`
  }

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Validating invitation code...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 11-16 0 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-center">Invitation Error</h2>
            <p className="text-gray-600 text-center">{error || "Invalid invitation code"}</p>
            <div className="flex flex-col w-full space-y-3">
              <button
                onClick={() => router.push("/")}
                className="w-full py-2 px-4 bg-lime-400 hover:bg-lime-500 text-black font-medium rounded-md"
              >
                Go to Homepage
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-white hover:bg-gray-100 text-black font-medium rounded-md border border-gray-300"
              >
                Try Again
              </button>
            </div>
            {debugInfo && <p className="text-xs text-gray-500 mt-4">Debug info: {debugInfo}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{trainerInfo?.name || "Your Coach"} Invited You to Join Juice</h1>
        <p className="text-gray-600 mb-6">
          Connect with {trainerInfo?.name || "your trainer"} to train smarter, together.
        </p>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            You've been invited to link your account with your personal trainer on Juice. This lets your trainer:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-lime-200 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-lime-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>See the workouts you complete</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-lime-200 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-lime-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Send you customized training programs</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-lime-200 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-lime-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Track your progress over time</span>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-lime-200 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-lime-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Give you better feedback, faster</span>
            </li>
          </ul>
        </div>

        <p className="text-gray-700 mb-4">Ready to lift smarter?</p>

        {isAlreadyAccepted ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Invitation Already Accepted</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This invitation has already been accepted. You can continue to create your account or log in if
                      you already have one.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleContinueToSignup}
                className="flex-1 py-3 px-4 bg-lime-400 hover:bg-lime-500 text-black font-medium rounded-md"
              >
                Accept Invitation (I'm new)
              </button>
              <button
                onClick={handleExistingAccount}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black font-medium rounded-md border border-gray-300"
              >
                Accept Invitation (I already have an account)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
              className="flex-1 py-3 px-4 bg-lime-400 hover:bg-lime-500 text-black font-medium rounded-md disabled:opacity-70 flex justify-center items-center"
            >
              {isAccepting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                "Accept Invitation (I'm new)"
              )}
            </button>
            <button
              onClick={handleExistingAccount}
              disabled={isAccepting}
              className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black font-medium rounded-md border border-gray-300 disabled:opacity-70"
            >
              Accept Invitation (I already have an account)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
