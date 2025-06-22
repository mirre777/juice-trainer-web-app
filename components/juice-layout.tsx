"use client"

import type React from "react"

import { UnifiedHeader } from "@/components/unified-header"
import { WhatsAppChatButton } from "@/components/shared/whatsapp-chat-button"

interface JuiceLayoutProps {
  children: React.ReactNode
}

export function JuiceLayout({ children }: JuiceLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />
      <main>{children}</main>
      <WhatsAppChatButton phoneNumber="+12345678900" />
    </div>
  )
}
