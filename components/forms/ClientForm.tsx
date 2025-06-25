"use client"

// Placeholder for components/forms/ClientForm.tsx
import type React from "react"

interface ClientFormProps {
  onSubmit: (data: any) => void
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submission
    onSubmit({ name: "New Client", email: "new@example.com" })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Client</h3>
      <div>
        <label htmlFor="clientName">Name:</label>
        <input id="clientName" type="text" />
      </div>
      <div>
        <label htmlFor="clientEmail">Email:</label>
        <input id="clientEmail" type="email" />
      </div>
      <button type="submit">Add Client</button>
    </form>
  )
}

export default ClientForm
