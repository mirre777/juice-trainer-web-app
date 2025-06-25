import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { generateId } from "lucia"
import { Argon2id } from "oslo/password"
import { cache } from "react"

import { lucia } from "@/lib/auth"
import { generateEmailVerificationToken, generatePasswordResetToken } from "@/lib/token"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"

const generateUserId = () => generateId(15)

const argon2id = new Argon2id()

export const register = async (values: any) => {
  const { email, password, name } = values

  const hashedPassword = await argon2id.hash(password)
  const userId = generateUserId()

  try {
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return { error: "Email already taken!" }
    }

    const user = await db.user.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
      },
    })

    const verificationToken = await generateEmailVerificationToken(email)
    await sendVerificationEmail(verificationToken.email, verificationToken.token)

    return { success: "Confirmation email sent!" }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to register." }
  }
}

export const login = async (values: any, callbackUrl?: string) => {
  const { email, password } = values

  try {
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (!existingUser || !existingUser.password) {
      return { error: "Invalid credentials!" }
    }

    const validPassword = await argon2id.verify(existingUser.password, password)

    if (!validPassword) {
      return { error: "Invalid credentials!" }
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await generateEmailVerificationToken(existingUser.email)
      await sendVerificationEmail(verificationToken.email, verificationToken.token)

      return { success: "Confirmation email sent!" }
    }

    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    redirect(callbackUrl || DEFAULT_LOGIN_REDIRECT)
  } catch (error) {
    console.error("Login error:", error)
    return { error: "Failed to login." }
  }
}

export const logout = async () => {
  const sessionId = lucia.readSessionCookie()
  if (!sessionId) {
    return { error: "Unauthorized" }
  }

  try {
    await lucia.invalidateSession(sessionId)
    const sessionCookie = lucia.createBlankSessionCookie()
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    redirect("/")
  } catch (error) {
    console.error("Logout error:", error)
    return { error: "Failed to logout." }
  }
}

export const resetPassword = async (email: string) => {
  try {
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (!existingUser) {
      return { error: "Email not found!" }
    }

    const passwordResetToken = await generatePasswordResetToken(email)
    await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token)

    return { success: "Reset email sent!" }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "Failed to reset password." }
  }
}

export const newPassword = async (values: any, token: string) => {
  const { password } = values

  try {
    const existingToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!existingToken) {
      return { error: "Invalid token!" }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
      return { error: "Token has expired!" }
    }

    const existingUser = await db.user.findUnique({
      where: { email: existingToken.email },
    })

    if (!existingUser) {
      return { error: "Email does not exist!" }
    }

    const hashedPassword = await argon2id.hash(password)

    await db.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    })

    await db.passwordResetToken.delete({
      where: { token },
    })

    return { success: "Password updated!" }
  } catch (error) {
    console.error("New password error:", error)
    return { error: "Failed to update password." }
  }
}

export const newVerification = async (token: string) => {
  try {
    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    })

    if (!existingToken) {
      return { error: "Invalid token!" }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
      return { error: "Token has expired!" }
    }

    const existingUser = await db.user.findUnique({
      where: { email: existingToken.email },
    })

    if (!existingUser) {
      return { error: "Email does not exist!" }
    }

    await db.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    })

    await db.verificationToken.delete({
      where: { token },
    })

    return { success: "Email verified!" }
  } catch (error) {
    console.error("New verification error:", error)
    return { error: "Failed to verify email." }
  }
}

export const getTwoFactorTokenByEmail = async (email: string) => {
  try {
    const twoFactorToken = await db.twoFactorToken.findFirst({
      where: { email },
    })

    return twoFactorToken
  } catch (error) {
    console.error("Get two factor token by email error:", error)
    return null
  }
}

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await db.verificationToken.findFirst({
      where: { email },
    })

    return verificationToken
  } catch (error) {
    console.error("Get verification token by email error:", error)
    return null
  }
}

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findFirst({
      where: { email },
    })

    return passwordResetToken
  } catch (error) {
    console.error("Get password reset token by email error:", error)
    return null
  }
}

export const getUserByEmail = cache(async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    })

    return user
  } catch (error) {
    console.error("Get user by email error:", error)
    return null
  }
})

export const getUserById = cache(async (userId: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    })

    return user
  } catch (error) {
    console.error("Get user by id error:", error)
    return null
  }
})
