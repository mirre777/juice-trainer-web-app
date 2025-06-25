"use client"

import type React from "react"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"

interface Props {
  children: React.ReactNode
}

export function ToastProviderWrapper({ children }: Props) {
  const { toasts, removeToast, onOpenChange } = useToast()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange])

  return (
    <ToastProvider>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id)
          }}
          variant={toast.variant}
        >
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription suppressHydrationWarning>{toast.description}</ToastDescription>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
