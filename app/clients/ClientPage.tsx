"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

interface Client {
  id: number
  name: string
  email: string
  phone: string
}

const LoadingSpinner = () => <div className="spinner">Loading...</div>

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<Client[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setClients(data)
      } catch (e: any) {
        setError(e.message)
      }
    }

    fetchClients()
  }, [])

  if (!clients) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <h1>Clients</h1>
      {error && <p>Error: {error}</p>}
      {clients && Array.isArray(clients) && clients.length > 0 ? (
        <ul>
          {(clients || []).map((client) => (
            <li key={client.id}>
              <Link to={`/clients/${client.id}`}>{client.name}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No clients found.</p>
      )}
      <Link to="/clients/new">Add New Client</Link>
    </div>
  )
}

export default ClientPage
