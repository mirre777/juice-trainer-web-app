"use client"

import ClientLayout from "@/app/ClientLayout"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <>
      <ClientLayout>{children}</ClientLayout>
    </>
  )
}
