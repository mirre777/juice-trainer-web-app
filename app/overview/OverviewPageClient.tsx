"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewHeader } from "@/components/overview/overview-header"
import { OverviewList } from "@/components/overview/overview-list"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Empty } from "@/components/empty"
import { SearchResults } from "@/components/search-results"

interface OverviewPageClientProps {
  orgId: string
  query?: string
}

const OverviewPageClient: React.FC<OverviewPageClientProps> = ({ orgId, query }) => {
  const router = useRouter()
  const { data: documents } = useQuery(api.documents.get, {
    orgId,
    query,
  })
  const { status } = useSession()
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  const onCreate = () => {
    setIsCreating(true)
  }

  if (status === "loading") {
    return (
      <div>
        <Skeleton className="h-14 w-[200px]" />
        <div className="mt-4">
          <Skeleton className="h-32 w-[200px]" />
        </div>
      </div>
    )
  }

  if (!documents && query) {
    return <SearchResults isCreating={isCreating} onCreate={onCreate} />
  }

  if (!documents?.length && !query) {
    return <Empty isCreating={isCreating} onCreate={onCreate} />
  }

  return (
    <div className="h-full">
      <OverviewHeader onCreate={onCreate} />
      {!!documents?.length ? (
        <OverviewList documents={documents} />
      ) : (
        <SearchResults isCreating={isCreating} onCreate={onCreate} />
      )}
    </div>
  )
}

export default OverviewPageClient
