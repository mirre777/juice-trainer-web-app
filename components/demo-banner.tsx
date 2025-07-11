"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function DemoBanner() {
  const pathname = usePathname()
  const isDemoPage = pathname?.includes("/demo/")

  if (!isDemoPage) return null

  return (
    <div className="bg-lime-50 border-b border-lime-200 py-2 sm:py-3 px-4 w-full relative z-40">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center justify-center sm:justify-start">
          <span className="inline-block mr-2">🚀</span>
          <p className="font-medium text-sm text-center sm:text-left">You're exploring the demo version</p>
        </div>
        <Link href="/signup">
          <button className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
            Start Now
          </button>
        </Link>
      </div>
    </div>
  )
}
