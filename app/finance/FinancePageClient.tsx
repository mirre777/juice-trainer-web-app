"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { getFinanceData } from "@/lib/actions/finance"
import type { FinanceData } from "@/lib/types"
import { handleError } from "@/lib/utils/error-handler"
import type { AppError } from "@/lib/utils/error-handler"

interface Props {
  children: React.ReactNode
}

const FinancePageClient = ({ children }: Props) => {
  const searchParams = useSearchParams()
  const ticker = searchParams.get("ticker")
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) {
        return
      }

      setIsLoading(true)
      try {
        const data = await getFinanceData(ticker)
        setFinanceData(data)
      } catch (error) {
        const appError = error as AppError
        handleError(appError)
        toast.error(appError.message || "Failed to fetch finance data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [ticker])

  return <>{children}</>
}

export default FinancePageClient
