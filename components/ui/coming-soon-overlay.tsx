"use client"

import type React from "react"

interface ComingSoonOverlayProps {
  children: React.ReactNode
  message?: string
}

export function ComingSoonOverlay({ children, message = "Coming Soon" }: ComingSoonOverlayProps) {
  return (
    <div className="relative" style={{ isolation: "isolate" }}>
      <div className="relative">{children}</div>
      <div
        className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center"
        style={{
          backgroundColor: "rgba(17, 24, 39, 0.7)",
          backdropFilter: "blur(1px)",
          borderRadius: "0.5rem",
          zIndex: 999,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "9999px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>{message}</span>
        </div>
      </div>
    </div>
  )
}
