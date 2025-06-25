"use client"

import type React from "react"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Overview } from "@/components/overview/Overview"
import { SkeletonOverview } from "@/components/overview/SkeletonOverview"
import { useAuth } from "@/hooks/use-auth"
import { useDebounce } from "@/hooks/use-debounce"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { AppError } from "@/lib/utils/error-handler"

interface OverviewPageClientProps {
  className?: string
}

export const OverviewPageClient: React.FC<OverviewPageClientProps> = ({ className }) => {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get(`/api/overview?search=${debouncedSearch}`)
        setData(response.data)
      } catch (error: any) {
        setError(error)
        toast.error(error?.message || "Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [debouncedSearch])

  if (!user) {
    return null
  }

  return (
    <div className={cn("w-full", className)}>
      {isLoading && <SkeletonOverview />}
      {!isLoading && data && <Overview data={data} search={search} setSearch={setSearch} />}
    </div>
  )
}
