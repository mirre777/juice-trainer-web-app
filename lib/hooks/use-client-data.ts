"use client"

import { useEffect } from "react"
import { getClientData } from "@/lib/actions/client"
import type { Client } from "@/lib/types"
import type { AppError } from "@/lib/utils/error-handler"

type UseClientDataResult = {
  client: Client | null
  isLoading: boolean
  error: AppError | null
}

export const useClientData = (clientId: string): UseClientDataResult => {
  \
  const [client, useState <Client | null>(null
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<AppError | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true)
      try {
        const clientData = await getClientData(clientId)
        if (clientData) {
          setClient(clientData)
          setError(null)
        } else {
          setError({ message: "Client not found", statusCode: 404 })
          setClient(null)
        }
      } catch (err: any) {
        setError({ message: err.message || "Failed to fetch client data", statusCode: 500 })
        setClient(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  return { client, isLoading, error }
}
