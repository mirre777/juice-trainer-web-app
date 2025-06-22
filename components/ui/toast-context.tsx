"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { ToastNotification } from "./toast-notification"

interface ToastOptions {
  title: string
  message?: string
  duration?: number | null // null means indefinite
  type?: "success" | "error" | "info" | "warning"
  pages?: string[] // Array of paths where the toast should be shown
  ctaButton?: {
    text: string
    onClick: () => void
  }
}

interface ToastContextType {
  toast: {
    success: (options: ToastOptions) => string
    error: (options: ToastOptions) => string
    info: (options: ToastOptions) => string
    warning: (options: ToastOptions) => string
    dismiss: (id: string) => void
  }
}

interface ToastItem extends ToastOptions {
  id: string
  visible: boolean
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdCounter = useRef(0)

  const addToast = useCallback((options: ToastOptions) => {
    const id = `toast-${toastIdCounter.current++}`
    const newToast: ToastItem = { id, visible: true, ...options }
    setToasts((prevToasts) => [...prevToasts, newToast])
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  // Auto-dismiss logic
  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration !== null && toast.duration !== undefined) {
        const timer = setTimeout(() => {
          dismissToast(toast.id)
        }, toast.duration)
        return () => clearTimeout(timer)
      }
    })
  }, [toasts, dismissToast])

  const toast = {
    success: (options: ToastOptions) => addToast({ ...options, type: "success" }),
    error: (options: ToastOptions) => addToast({ ...options, type: "error" }),
    info: (options: ToastOptions) => addToast({ ...options, type: "info" }),
    warning: (options: ToastOptions) => addToast({ ...options, type: "warning" }),
    dismiss: dismissToast,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map((t) => (
          <ToastNotification key={t.id} {...t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
