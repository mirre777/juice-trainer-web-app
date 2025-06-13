"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export interface ToastNotificationProps {
  id?: string
  title: string
  message: string
  type?: "success" | "error" | "warning" | "info"
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
  duration?: number | null // null means no auto-dismiss
  showIcon?: boolean
  ctaButton?: {
    text: string
    onClick: () => void
  }
  onDismiss?: () => void
  className?: string
}

type AnimationState = "hidden" | "entering" | "visible" | "exiting"

const getPositionClasses = (position: ToastNotificationProps["position"]) => {
  switch (position) {
    case "top-left":
      return "top-24 left-4"
    case "top-center":
      return "top-24 left-1/2 transform -translate-x-1/2"
    case "top-right":
    default:
      return "top-24 right-4"
    case "bottom-left":
      return "bottom-4 left-4"
    case "bottom-center":
      return "bottom-4 left-1/2 transform -translate-x-1/2"
    case "bottom-right":
      return "bottom-4 right-4"
  }
}

const getIcon = (type: ToastNotificationProps["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-6 w-6 text-green-600" />
    case "error":
      return <AlertCircle className="h-6 w-6 text-red-600" />
    case "warning":
      return <AlertTriangle className="h-6 w-6 text-yellow-600" />
    case "info":
    default:
      return <Info className="h-6 w-6 text-blue-600" />
  }
}

const getTypeStyles = (type: ToastNotificationProps["type"]) => {
  switch (type) {
    case "success":
      return "border-green-200 bg-green-50"
    case "error":
      return "border-red-200 bg-red-50"
    case "warning":
      return "border-yellow-200 bg-yellow-50"
    case "info":
    default:
      return "border-black bg-white"
  }
}

export function ToastNotification({
  title,
  message,
  type = "info",
  position = "top-right",
  duration = 5000,
  showIcon = true,
  ctaButton,
  onDismiss,
  className = "",
}: ToastNotificationProps) {
  const [animationState, setAnimationState] = useState<AnimationState>("entering")
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const toastRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

  useEffect(() => {
    // Start with entering animation
    const enterTimer = setTimeout(() => {
      setAnimationState("visible")
    }, 50)

    // Auto-dismiss if duration is set
    let dismissTimer: NodeJS.Timeout
    if (duration && duration > 0) {
      dismissTimer = setTimeout(() => {
        handleDismiss()
      }, duration)
    }

    return () => {
      clearTimeout(enterTimer)
      if (dismissTimer) clearTimeout(dismissTimer)
    }
  }, [duration])

  const handleDismiss = () => {
    setAnimationState("exiting")
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  // Touch/Mouse event handlers for swipe-to-dismiss
  const handleStart = (clientX: number) => {
    setIsDragging(true)
    startXRef.current = clientX
    currentXRef.current = clientX
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return

    currentXRef.current = clientX
    const deltaX = clientX - startXRef.current

    // Only allow swiping to the right
    if (deltaX > 0) {
      setDragOffset(deltaX)
    }
  }

  const handleEnd = () => {
    if (!isDragging) return

    const deltaX = currentXRef.current - startXRef.current
    const threshold = 100 // Minimum distance to trigger dismiss

    if (deltaX > threshold) {
      // Dismiss the toast
      handleDismiss()
    } else {
      // Snap back to original position
      setDragOffset(0)
    }

    setIsDragging(false)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Add global mouse move and up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX)
      }

      const handleGlobalMouseUp = () => {
        handleEnd()
      }

      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }
  }, [isDragging])

  const positionClasses = getPositionClasses(position)
  const typeStyles = getTypeStyles(type)
  const icon = showIcon ? getIcon(type) : null

  // Animation classes based on position and drag state
  const getAnimationClasses = () => {
    const isRight = position.includes("right")
    const isLeft = position.includes("left")
    const isCenter = position.includes("center")

    let translateClass = ""
    if (isRight) translateClass = "translate-x-full"
    else if (isLeft) translateClass = "-translate-x-full"
    else if (isCenter) translateClass = "translate-y-full"

    // Apply drag offset if dragging
    const dragTransform = isDragging || dragOffset > 0 ? `translateX(${dragOffset}px)` : ""

    switch (animationState) {
      case "entering":
        return `opacity-0 transform ${translateClass} scale-95`
      case "visible":
        return `opacity-100 transform translate-x-0 translate-y-0 scale-100 ${dragTransform ? `[transform:${dragTransform}]` : ""}`
      case "exiting":
        return `opacity-0 transform ${translateClass} scale-95`
      default:
        return `opacity-0 transform ${translateClass} scale-95`
    }
  }

  // Calculate opacity based on drag distance
  const getDragOpacity = () => {
    if (dragOffset === 0) return 1
    const maxDrag = 200
    const opacity = Math.max(0.3, 1 - dragOffset / maxDrag)
    return opacity
  }

  return (
    <div className={`fixed z-50 max-w-md ${positionClasses}`}>
      <div
        ref={toastRef}
        className={`border shadow-lg rounded-md overflow-hidden transition-all duration-300 ease-out cursor-grab active:cursor-grabbing select-none ${typeStyles} ${getAnimationClasses()} ${className}`}
        style={{
          boxShadow: type === "success" ? "0 0 10px 2px rgba(76, 175, 80, 0.3)" : undefined,
          opacity: getDragOpacity(),
          transform: dragOffset > 0 ? `translateX(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "all 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors duration-200 z-10"
            aria-label="Close notification"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start">
            {icon && <div className="flex-shrink-0 mr-3">{icon}</div>}

            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>

              <p className="text-sm text-gray-700 mb-3">{message}</p>

              {ctaButton && (
                <div className="flex justify-end">
                  <Button
                    onClick={ctaButton.onClick}
                    className="bg-black hover:bg-gray-800 text-white text-xs px-4 py-1 h-8 rounded transition-colors duration-200"
                  >
                    {ctaButton.text}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swipe indicator */}
        {dragOffset > 20 && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
