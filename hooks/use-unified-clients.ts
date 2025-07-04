"use client"

import { useState, useEffect, useCallback } from "react"
import { clientService, type ClientsState } from "@/lib/services/unified-client-service"
import type { Client } from "@/types/client"

export function useUnifiedClients() {
  const [clientsState, setClientsState] = useState<ClientsState>(() => clientService.getState())

  useEffect(() => {
    console.log("[useUnifiedClients] Setting up clients subscription")

    const unsubscribe = clientService.subscribe((state) => {
      console.log("[useUnifiedClients] Clients state updated:", {
        clientCount: state.clients.length,
        loading: state.loading,
        error: state.error,
      })
      setClientsState(state)
    })

    // Initial fetch
    clientService.fetchClients()

    return () => {
      console.log("[useUnifiedClients] Cleaning up clients subscription")
      unsubscribe()
    }
  }, [])

  const refreshClients = useCallback(async () => {
    console.log("[useUnifiedClients] Refreshing clients...")
    return await clientService.fetchClients(true)
  }, [])

  const addClient = useCallback(async (clientData: Partial<Client>) => {
    console.log("[useUnifiedClients] Adding client:", clientData.name)
    return await clientService.addClient(clientData)
  }, [])

  const updateClient = useCallback(async (clientId: string, updates: Partial<Client>) => {
    console.log("[useUnifiedClients] Updating client:", clientId)
    return await clientService.updateClient(clientId, updates)
  }, [])

  const deleteClient = useCallback(async (clientId: string) => {
    console.log("[useUnifiedClients] Deleting client:", clientId)
    return await clientService.deleteClient(clientId)
  }, [])

  const clearCache = useCallback(() => {
    console.log("[useUnifiedClients] Clearing cache")
    clientService.clearCache()
  }, [])

  return {
    clients: clientsState.clients,
    loading: clientsState.loading,
    error: clientsState.error,
    refreshClients,
    addClient,
    updateClient,
    deleteClient,
    clearCache,
  }
}

// Convenience hook for just getting clients list
export function useClientsList(): { clients: Client[]; loading: boolean } {
  const { clients, loading } = useUnifiedClients()
  return { clients, loading }
}
