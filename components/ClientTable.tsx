// Placeholder for components/ClientTable.tsx
import type React from "react"

interface ClientTableProps {
  clients: any[]
}

const ClientTable: React.FC<ClientTableProps> = ({ clients }) => {
  return (
    <div>
      <h2>Client Table</h2>
      {clients.length === 0 ? (
        <p>No clients to display.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr key={index}>
                <td>{client.name}</td>
                <td>{client.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ClientTable
