"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"
import {
  Toast,
  ToastProvider as RadixToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"
import { AnimatePresence, motion } from "framer-motion"

type ToastType = "default" | "success" | "error" | "warning"

interface ToastItem {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, "id">) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = (toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id, duration: toast.duration || 3000 }
    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after duration
    setTimeout(() => {
      dismissToast(id)
    }, newToast.duration)

    return id
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <RadixToastProvider>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              drag="x"
              dragConstraints={{ left: 0, right: 300 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) {
                  dismissToast(toast.id)
                }
              }}
            >
              <Toast variant={toast.type === "success" ? "success" : "default"} className="mb-2">
                <div>
                  <ToastTitle>{toast.title}</ToastTitle>
                  {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
                </div>
                <ToastClose onClick={() => dismissToast(toast.id)} />
              </Toast>
            </motion.div>
          ))}
        </AnimatePresence>
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  const { addToast, dismissToast } = context

  const toast = {
    default: (props: Omit<ToastItem, "id" | "type">) => addToast({ ...props, type: "default" }),
    success: (props: Omit<ToastItem, "id" | "type">) => addToast({ ...props, type: "success" }),
    error: (props: Omit<ToastItem, "id" | "type">) => addToast({ ...props, type: "error" }),
    warning: (props: Omit<ToastItem, "id" | "type">) => addToast({ ...props, type: "warning" }),
  }

  return { toast, dismissToast }
}
