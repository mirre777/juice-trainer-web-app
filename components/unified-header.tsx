"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Overview", href: "/overview" },
  { name: "Clients", href: "/clients" },
  { name: "Programs", href: "/programs" },
  { name: "Marketplace", href: "/marketplace" },
]

export function UnifiedHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-black">
              Juice
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-black border-b-2 border-black" : "text-gray-500",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">User</span>
            <Button className="bg-[#CCFF00] text-black hover:bg-[#B8E600]">Upgrade</Button>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
