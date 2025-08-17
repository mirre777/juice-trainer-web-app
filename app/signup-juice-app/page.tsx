import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JuiceAppSignupPage({
  searchParams,
}: {
  searchParams: { inviteCode?: string; tn?: string }
}) {
  const inviteCode = searchParams.inviteCode || ""
  const trainerName = searchParams.tn ? decodeURIComponent(searchParams.tn) : ""

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Join Juice</CardTitle>
          <CardDescription className="text-center">Create your account to start your fitness journey</CardDescription>

          {inviteCode && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">You've been invited to join Juice!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Create an account to connect with your trainer.</p>
                    <p className="mt-1">
                      <strong>Invitation code:</strong> {inviteCode}
                    </p>
                    {trainerName && (
                      <p>
                        <strong>Trainer:</strong> {trainerName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <AuthForm mode="signup" inviteCode={inviteCode} trainerName={trainerName} isTrainerSignup={false} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
