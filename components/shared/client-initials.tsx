interface ClientInitialsProps {
  initials: string
  size?: "sm" | "md" | "lg"
  className?: string
  backgroundColor?: string
}

export function ClientInitials({ initials, size = "md", className = "", backgroundColor }: ClientInitialsProps) {
  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  }

  return (
    <div
      className={`
        flex items-center justify-center 
        rounded-full 
        bg-white
        border border-black
        text-black font-medium
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {initials}
    </div>
  )
}
