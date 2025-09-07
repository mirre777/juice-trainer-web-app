"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, MessageCircle, Mail, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-context"

interface ClientInvitationDialogProps {
  isOpen: boolean
  onClose: () => void
  client: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  inviteCode: string
  isReinvite?: boolean
}

export function ClientInvitationDialog({
  isOpen,
  onClose,
  client,
  inviteCode,
  isReinvite = false,
}: ClientInvitationDialogProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  // Generate the invite link using trainer's universal code
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
  // if the appUrl ends with /, remove it
  const appUrlWithoutTrailingSlash = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl
  const inviteLink = `${appUrlWithoutTrailingSlash}/trainer-invite/${inviteCode}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success({
        title: "Copied!",
        message: "Invitation link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error({
        title: "Error",
        message: "Failed to copy link",
      })
    }
  }

  // Helper function to format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    if (!phone) return ""
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "")
    // If it starts with 0, replace with country code (assuming it's missing)
    if (cleaned.startsWith("0")) {
      return cleaned.substring(1)
    }
    return cleaned
  }

  const shareViaWhatsApp = () => {
    const message = `Hi ${client.name}! 🏋️‍♂️\n\nYou're invited to join my fitness coaching platform. Click the link below to get started:\n\n${inviteLink}\n\nLooking forward to working with you!`

    let whatsappUrl = ""

    if (client.phone && client.phone.trim()) {
      // Open specific chat with phone number
      const formattedPhone = formatPhoneForWhatsApp(client.phone)
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      console.log("📱 [WhatsApp] Opening chat with phone:", formattedPhone)
    } else {
      // Open WhatsApp with message but no specific contact
      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      console.log("📱 [WhatsApp] Opening general WhatsApp")
    }

    window.open(whatsappUrl, "_blank")
  }

  const shareViaEmail = () => {
    const subject = `Invitation to Join My Fitness Coaching Platform`
    const body = `Hi ${client.name},\n\nYou're invited to join my fitness coaching platform! Click the link below to create your account and get started:\n\n${inviteLink}\n\nI'm excited to work with you on your fitness journey!\n\nBest regards`

    if (client.email && client.email.trim()) {
      // Open Gmail in browser with specific recipient
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      console.log("📧 [Email] Opening Gmail with recipient:", client.email)
      window.open(gmailUrl, "_blank")
    } else {
      // Open Gmail with empty recipient
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      console.log("📧 [Email] Opening Gmail with empty recipient")
      window.open(gmailUrl, "_blank")
    }
  }

  const shareViaGeneric = () => {
    if (navigator.share) {
      navigator.share({
        title: "Fitness Coaching Invitation",
        text: `Join my fitness coaching platform!`,
        url: inviteLink,
      })
    } else {
      copyToClipboard()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {isReinvite ? `Reinvite ${client.name}` : `Invite ${client.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              {isReinvite
                ? "Send this invitation link to your client again:"
                : "Send this invitation link to your client:"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-link" className="text-sm font-medium">
              Invitation Link
            </Label>
            <div className="flex gap-2">
              <Input id="invite-link" value={inviteLink} readOnly className="font-mono text-sm bg-gray-50" />
              <Button onClick={copyToClipboard} variant="outline" size="icon" className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button onClick={shareViaWhatsApp} variant="outline" className="flex items-center gap-2 py-3">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>

            <Button onClick={shareViaEmail} variant="outline" className="flex items-center gap-2 py-3">
              <Mail className="h-4 w-4" />
              Email
            </Button>

            <Button onClick={shareViaGeneric} variant="outline" className="flex items-center gap-2 py-3">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-3">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Your client clicks the invitation link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>They create their account using the link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>They're automatically connected to you as their trainer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>You can track their progress and share training programs</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="px-8">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
