"use client"

import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"

interface WhatsAppChatButtonProps {
  phoneNumber: string
}

export function WhatsAppChatButton({ phoneNumber }: WhatsAppChatButtonProps) {
  const pathname = usePathname()

  // Hide on these specific pages
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null
  }

  const handleClick = () => {
    window.open(`https://wa.me/${phoneNumber}?text=Hello!%20I%20have%20a%20question%20about%20my%20training.`, "_blank")
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black shadow-lg transition-transform hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </button>
  )
}
