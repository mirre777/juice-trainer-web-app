"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { ToastNotification, type ToastNotificationProps } from "./toast-notification"

interface Toast extends Omit<ToastNotificationProps, "onDismiss"> {
  id: string
  pages?: string[] // Optional: specific pages where this toast should show
  excludePages?: string[] // Optional: pages where this toast should NOT show
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const pathname = usePathname()

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Filter toasts based on current page
  const visibleToasts = toasts.filter((toast) => {
    // If pages array is specified, only show on those pages
    if (toast.pages && toast.pages.length > 0) {
      return toast.pages.some((page) => pathname.startsWith(page))
    }

    // If excludePages array is specified, don't show on those pages
    if (toast.excludePages && toast.excludePages.length > 0) {
      return !toast.excludePages.some((page) => pathname.startsWith(page))
    }

    // Default: show on all pages
    return true
  })

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}

      {/* Render only page-relevant toasts */}
      {visibleToasts.map((toast) => (
        <ToastNotification key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  const { addToast, removeToast, clearAllToasts } = context

  const toast = {
    success: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "success" }),
    error: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "error" }),
    warning: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "warning" }),
    info: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "info" }),
    custom: (props: Omit<Toast, "id">) => addToast(props),
  }

  return { toast, removeToast, clearAllToasts }
}
