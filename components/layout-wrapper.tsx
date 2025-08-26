"use client"

import { usePathname } from "next/navigation"
import ClientLayout from "@/app/ClientLayout"
import { DemoBanner } from "@/components/demo-banner"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isPublicRoute = pathname.startsWith("/public/")

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <>
      <DemoBanner />
      <ClientLayout>{children}</ClientLayout>
    </>
  )
}
