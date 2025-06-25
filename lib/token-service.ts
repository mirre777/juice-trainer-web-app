import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

import { getAccessTokenByRefreshToken } from "@/data/refresh-token"
import { getVerificationTokenByEmail } from "@/data/verification-token"
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token"
import { db } from "@/lib/db"
import { generateVerificationToken, generatePasswordResetToken } from "@/lib/tokens"
import { AppError } from "@/lib/utils/error-handler"

export const tokenService = {
  async newVerificationToken(email: string) {
    try {
      const existingToken = await getVerificationTokenByEmail(email)

      if (existingToken) {
        await db.verificationToken.delete({
          where: { id: existingToken.id },
        })
      }

      const token = await generateVerificationToken(email)
      return token
    } catch (error: any) {
      throw new AppError("Failed to generate verification token", 500)
    }
  },

  async newPasswordResetToken(email: string) {
    try {
      const existingToken = await getPasswordResetTokenByEmail(email)

      if (existingToken) {
        await db.passwordResetToken.delete({
          where: { id: existingToken.id },
        })
      }

      const token = await generatePasswordResetToken(email)
      return token
    } catch (error: any) {
      throw new AppError("Failed to generate password reset token", 500)
    }
  },

  async newRefreshToken() {
    const newRefreshToken = uuidv4()
    return newRefreshToken
  },

  async newAccessToken(refreshToken: string) {
    try {
      const existingRefreshToken = await getAccessTokenByRefreshToken(refreshToken)

      if (!existingRefreshToken) {
        throw new AppError("Refresh token not found", 404)
      }

      if (existingRefreshToken.expires < new Date()) {
        await db.refreshToken.delete({
          where: { id: existingRefreshToken.id },
        })
        throw new AppError("Refresh token expired", 400)
      }

      const newAccessToken = uuidv4()
      return newAccessToken
    } catch (error: any) {
      throw new AppError(error.message || "Failed to generate access token", error.statusCode || 500)
    }
  },

  setRefreshTokenCookie(refreshToken: string) {
    cookies().set("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/api/auth",
      secure: true,
      sameSite: "strict",
    })
  },
}
