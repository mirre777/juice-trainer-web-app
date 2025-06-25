"use client"

import type React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as SonnerToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SonnerToastProvider>
      {children}
      <ToasterThemeSetter setTheme={setTheme} mounted={mounted} />
    </SonnerToastProvider>
  )
}

interface ToasterThemeSetterProps {
  setTheme: (theme: "light" | "dark" | "system") => void
  mounted: boolean
}

function ToasterThemeSetter({ setTheme, mounted }: ToasterThemeSetterProps) {
  useEffect(() => {
    if (!mounted) {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      setTheme(mediaQuery.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [setTheme, mounted])

  return null
}

export function AppToast() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose aria-label="Close" />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
