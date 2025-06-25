import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

import { env } from "@/env.mjs"
import { redis } from "@/lib/redis"
import { AppError } from "@/lib/utils/error-handler"

export async function generateClientToken() {
  const clientToken = uuidv4()
  const expires = new Date(Date.now() + env.CLIENT_TOKEN_EXPIRATION)

  try {
    await redis.set(clientToken, JSON.stringify({ expires: expires.getTime() }), {
      exat: expires,
    })

    cookies().set("clientToken", clientToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return clientToken
  } catch (err) {
    console.error(err)
    throw new AppError("Failed to generate client token", 500)
  }
}

export async function validateClientToken() {
  const clientToken = cookies().get("clientToken")?.value

  if (!clientToken) {
    return false
  }

  try {
    const tokenData = await redis.get(clientToken)

    if (!tokenData) {
      return false
    }

    const { expires } = JSON.parse(tokenData) as { expires: number }

    if (Date.now() > expires) {
      return false
    }

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export async function invalidateClientToken() {
  const clientToken = cookies().get("clientToken")?.value

  if (!clientToken) {
    return
  }

  try {
    await redis.del(clientToken)
    cookies().delete("clientToken")
  } catch (err) {
    console.error(err)
  }
}
