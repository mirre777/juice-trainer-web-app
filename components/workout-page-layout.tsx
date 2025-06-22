"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type React from "react"

interface WorkoutPageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function WorkoutPageLayout({ children, className = "" }: WorkoutPageLayoutProps) {
  const pathname = usePathname()
  const [rightSideContent, setRightSideContent] = useState<React.ReactNode>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(true)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordsMatch(e.target.value === confirmPassword)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setPasswordsMatch(password === e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordsMatch(false)
      return
    }
    // Handle signup logic here
  }

  // Update the right side content based on the URL
  useEffect(() => {
    if (pathname === "/login") {
      setRightSideContent(
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Juice</h1>
            <p className="text-muted-foreground mt-2">Track your clients' fitness journey</p>
          </div>

          <div className="space-y-4">
            <div className="w-full">
              <input type="email" placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-md" />
            </div>
            <div className="w-full">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md"
              />
            </div>
            <button className="w-full py-3 bg-black text-white rounded-md font-medium">Login</button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/signup" className="text-black hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>,
      )
    } else if (pathname === "/signup") {
      setRightSideContent(
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Juice</h1>
            <p className="text-muted-foreground mt-2">Track your clients' fitness journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name"
                className="w-full px-4 py-3 border border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="Last name"
                className="w-full px-4 py-3 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="w-full">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="w-full">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="w-full">
              <input
                type="password"
                placeholder="Confirm password"
                className={`w-full px-4 py-3 border rounded-md ${
                  passwordsMatch ? "border-gray-300" : "border-red-500"
                }`}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
              />
              {!passwordsMatch && <p className="text-red-500 text-sm mt-1">Passwords do not match</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-black text-white rounded-md font-medium"
              disabled={!passwordsMatch}
            >
              Sign Up
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-black hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>,
      )
    } else {
      setRightSideContent(
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold">Juice</h1>
            <p className="text-muted-foreground mt-2">Track your clients' fitness journey</p>
          </div>

          <div className="flex gap-4 mt-8">
            <Link href="/login" className="flex-1">
              <button className="w-full py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Login
              </button>
            </Link>
            <Link href="/signup" className="flex-1">
              <button className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800">
                Sign Up
              </button>
            </Link>
          </div>
        </div>,
      )
    }
  }, [pathname])

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${className}`}>
      {/* Left side - Content */}
      <div className="flex-1 bg-gray-50 p-6 md:p-10 flex items-center justify-center">{children}</div>

      {/* Right side - Login/Signup UI */}
      <div className="flex-1 p-6 md:p-10 flex items-center justify-center">{rightSideContent}</div>

      {/* Play Around First button at the bottom right */}
      <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-1">
        <Link href="/demo/dashboard">
          <button className="bg-black hover:bg-black/90 text-white rounded-full shadow-lg px-5 py-2.5 flex items-center gap-2">
            <span className="font-medium">Play Around First</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </Link>
        <span className="text-xs text-gray-500 mr-2">No sign up needed</span>
      </div>
    </div>
  )
}
