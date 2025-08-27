"use server"

import { cookies } from "next/headers"

export const importProgram = async (programId: string) => {
  const cookieStore = await cookies()

  // Get all cookies and format them as a cookie header
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/programs/${programId}/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
  })

  if (!response.ok) {
    console.error("Error importing program:", response.statusText)
    throw new Error(`Failed to import program: ${response.statusText}`)
  }

  return response.json()
}
