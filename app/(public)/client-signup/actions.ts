"use server"

import { cookies } from "next/headers"

export const importProgram = async (programId: string) => {
  const cookieStore = await cookies()

  // Get all cookies and format them as a cookie header
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  console.log("invoking import program", programId)
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/programs/${programId}/import`
  console.log("url", url)

  const response = await fetch(url, {
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
