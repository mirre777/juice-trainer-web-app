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
  { name: "Sessions", href: "/sessions" },
]

export function UnifiedHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/overview" className="text-2xl font-bold text-[#CCFF00]">
              Juice
            </Link>
            <nav className="ml-10 flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-1 pt-1 text-sm font-medium",
                    pathname === item.href
                      ? "border-b-2 border-[#CCFF00] text-gray-900"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              User
            </Button>
            <Button className="bg-[#CCFF00] text-black hover:bg-[#B8E600]" size="sm">
              Upgrade
            </Button>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
