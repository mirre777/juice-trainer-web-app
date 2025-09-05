"use server"

import { cookies } from "next/headers"

export const importProgram = async (programId: string) => {
  const { cookieHeader } = await validateAndGetCookieHeader()

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

export const acceptInvite = async (inviteCode: string) => {
  const { cookieHeader } = await validateAndGetCookieHeader()

  console.log("invoking accept invite", inviteCode)
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invitations/${inviteCode}/redeem`
  console.log("url", url)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
  })

  if (!response.ok) {
    console.error("Error accepting invite:", response.statusText)
    throw new Error(`Failed to accept invite: ${response.statusText}`)
  }

  return response.json()
}

const validateAndGetCookieHeader = async () => {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userIdAlt = cookieStore.get("userId")?.value
  const user = userId || userIdAlt
  if (!user) {
    throw new Error("No user_id in cookies")
  }

  // Get all cookies and format them as a cookie header
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  return {
    userId: user,
    cookieHeader: cookieHeader,
  }
}