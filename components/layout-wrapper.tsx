"use client"

import ClientLayout from "@/app/ClientLayout"
import { DemoBanner } from "@/components/demo-banner"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <>
      <DemoBanner />
      <ClientLayout>{children}</ClientLayout>
    </>
  )
}
