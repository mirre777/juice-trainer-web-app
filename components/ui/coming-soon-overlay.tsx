"use client"

interface ComingSoonOverlayProps {
  className?: string
}

export function ComingSoonOverlay({ className = "" }: ComingSoonOverlayProps) {
  return (
    <div
      className={`absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg ${className}`}
    >
      <div className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium">Coming Soon</div>
    </div>
  )
}
