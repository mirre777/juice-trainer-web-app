import Link from "next/link"

interface ViewHistoryLinkProps {
  href: string
  className?: string
}

export function ViewHistoryLink({ href, className = "" }: ViewHistoryLinkProps) {
  return (
    <Link
      href={href}
      className={`text-black border-b-2 border-[#D2FF28] hover:bg-gray-50 px-1 py-0.5 text-sm ${className}`}
    >
      View history
    </Link>
  )
}
