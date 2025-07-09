"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, Menu, X } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"

interface User {
  uid: string
  email: string
  name?: string
  displayName?: string
  role?: string
}

export function UnifiedHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("[UnifiedHeader] Fetching user data...")
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("[UnifiedHeader] Response status:", response.status)

        if (response.ok) {
          const userData = await response.json()
          console.log("[UnifiedHeader] User data received:", userData)
          setUser(userData)
        } else {
          console.error("[UnifiedHeader] Failed to fetch user data")
          setUser(null)
        }
      } catch (error) {
        console.error("[UnifiedHeader] Error fetching user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const getDisplayName = (user: User | null): string => {
    if (!user) return "Loading..."

    // Try different name fields in order of preference
    if (user.name) return user.name
    if (user.displayName) return user.displayName
    if (user.email) {
      // Extract name from email (before @)
      const emailName = user.email.split("@")[0]
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    return "User"
  }

  const getInitials = (user: User | null): string => {
    if (!user) return "L"

    const displayName = getDisplayName(user)
    if (displayName === "Loading...") return "L"

    const words = displayName.split(" ")
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return displayName.charAt(0).toUpperCase()
  }

  const navItems = [
    { name: "Overview", href: "/overview" },
    { name: "Clients", href: "/clients" },
    { name: "Calendar", href: "/calendar" },
    { name: "Programs", href: "/programs" },
    { name: "Marketplace", href: "/marketplace" },
  ]

  const isActive = (href: string) => {
    if (href === "/overview") {
      return pathname === "/" || pathname === "/overview"
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/overview" className="text-2xl font-bold text-black">
              Juice
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href) ? "text-black border-b-2 border-[#CCFF00]" : "text-gray-600 hover:text-black"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">{loading ? "Loading..." : getDisplayName(user)}</span>
            <button className="bg-[#CCFF00] text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b8e600] transition-colors">
              Upgrade
            </button>
            <Link href="/settings">
              <Settings className="h-5 w-5 text-gray-600 hover:text-black cursor-pointer" />
            </Link>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">{loading ? "L" : getInitials(user)}</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 hover:text-black">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActive(item.href) ? "text-black bg-gray-50" : "text-gray-600"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">{loading ? "L" : getInitials(user)}</span>
                  </div>
                  <span className="text-sm text-gray-600">{loading ? "Loading..." : getDisplayName(user)}</span>
                </div>
                <div className="flex flex-col space-y-2 px-3 pt-2">
                  <button className="bg-[#CCFF00] text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-[#b8e600] transition-colors">
                    Upgrade
                  </button>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2 text-gray-600 hover:text-black">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </div>
                  </Link>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
