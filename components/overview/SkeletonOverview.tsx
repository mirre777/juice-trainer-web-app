// Placeholder for components/overview/SkeletonOverview.tsx
import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const SkeletonOverview: React.FC = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
