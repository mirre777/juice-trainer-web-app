"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type React from "react"
import { usePathname } from "next/navigation"

interface AuthLayoutProps {
  children: React.ReactNode
  contentSide: React.ReactNode
}

export function AuthLayout({ children, contentSide }: AuthLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Left side - Content (Workout Card) */}
      <div className="w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right side - Login/Signup UI */}
      <div className="w-1/2 bg-white flex items-center justify-center">
        <div className="w-full max-w-md px-6">{contentSide}</div>
      </div>

      {/* Play Around First button floating on top */}
      <Link
        href="/demo/overview"
        className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-1"
        style={{ display: pathname === "/" || pathname === "/login" || pathname === "/signup" ? "flex" : "none" }}
      >
        <div className="bg-black hover:bg-black/90 text-white rounded-full shadow-lg px-5 py-2.5 flex items-center gap-2">
          <span className="font-medium">Play Around First</span>
          <ArrowRight className="h-5 w-5" />
        </div>
        <span className="text-xs text-gray-500 mr-2">No sign up needed</span>
      </Link>
    </div>
  )
}
