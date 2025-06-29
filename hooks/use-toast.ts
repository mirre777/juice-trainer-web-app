"use client"

import { useState } from "react"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

type ToastType = "default" | "success" | "error" | "warning"

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, "id">) => {
    try {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id, duration: toast.duration || 3000 }
      setToasts((prev) => [...prev, newToast])

      // Auto dismiss after duration
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration)

      return id
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useToast",
        operation: "addToast",
        message: "Failed to add toast notification",
        errorType: ErrorType.UI_ERROR,
      })

      console.error("Toast error:", appError)
      return ""
    }
  }

  const dismissToast = (id: string) => {
    try {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useToast",
        operation: "dismissToast",
        message: "Failed to dismiss toast notification",
        errorType: ErrorType.UI_ERROR,
      })

      console.error("Toast dismiss error:", appError)
    }
  }

  const toast = {
    default: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "default" }),
    success: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "success" }),
    error: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "error" }),
    warning: (props: Omit<Toast, "id" | "type">) => addToast({ ...props, type: "warning" }),
  }

  return { toasts, toast, dismissToast }
}
