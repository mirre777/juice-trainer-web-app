"use client"

import { useState, useEffect } from "react"
import { getClientData } from "@/lib/actions/client"
import type { Client } from "@/lib/types"
import type { AppError } from "@/lib/utils/error-handler"

type UseClientDataResult = {
  client: Client | null
  isLoading: boolean
  error: AppError | null
}

export const useClientData = (clientId: string): UseClientDataResult => {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<AppError | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true)
      try {
        const clientData = await getClientData(clientId)
        setClient(clientData)
        setError(null)
      } catch (err: any) {
        setError({
          message: err.message || "Failed to fetch client data",
          status: err.status || 500,
        })
        setClient(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  return { client, isLoading, error }
}
