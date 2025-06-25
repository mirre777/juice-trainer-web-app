import { db } from "@/lib/db"
import { RegisterSchema } from "@/schemas"
import type * as z from "zod"
import bcrypt from "bcryptjs"
import { SettingsSchema } from "@/schemas"
import { getUserByEmail, getUserById } from "@/data/user"
import { generateVerificationToken, generateTwoFactorToken } from "@/lib/tokens"
import { sendVerificationEmail, sendTwoFactorEmail } from "@/lib/mail"
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token"

export class AuthService {
  static async register(values: z.infer<typeof RegisterSchema>) {
    const validatedFields = RegisterSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid fields!" }
    }

    const { email, password, name } = validatedFields.data

    const hashedPassword = await bcrypt.hash(password, 10)

    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return { error: "Email already in use!" }
    }

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    const verificationToken = await generateVerificationToken(email)

    await sendVerificationEmail(verificationToken.email, verificationToken.token)

    return { success: "Confirmation email sent!" }
  }

  static async login(values: z.infer<typeof RegisterSchema>) {
    const validatedFields = RegisterSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid fields!" }
    }

    const { email, password } = validatedFields.data

    const existingUser = await getUserByEmail(email)

    if (!existingUser || !existingUser.password || !existingUser.email) {
      return { error: "Invalid credentials!" }
    }

    const passwordsMatch = await bcrypt.compare(password, existingUser.password)

    if (!passwordsMatch) {
      return { error: "Invalid credentials!" }
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(existingUser.email)

      await sendVerificationEmail(verificationToken.email, verificationToken.token)

      return { success: "Confirmation email sent!" }
    }

    if (existingUser.isTwoFactorEnabled && existingUser.email) {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email)
      await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token)

      return { twoFactor: true }
    }

    return { success: "Logged in!" }
  }

  static async verifyEmail(token: string) {
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

    const existingUser = await getUserByEmail(existingToken.email)

    if (!existingUser) {
      return { error: "Email not found!" }
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
  }

  static async generateVerificationToken(email: string) {
    const token = await generateVerificationToken(email)
    return token
  }

  static async generateTwoFactorToken(email: string) {
    const token = await generateTwoFactorToken(email)
    return token
  }

  static async verifyTwoFactorToken(email: string, token: string) {
    const existingToken = await getTwoFactorTokenByEmail(email)

    if (!existingToken) {
      return { error: "Invalid token!" }
    }

    if (existingToken.token !== token) {
      return { error: "Invalid token!" }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
      return { error: "Token has expired!" }
    }

    await db.twoFactorToken.delete({
      where: { id: existingToken.id },
    })

    const existingConfirmation = await getTwoFactorConfirmationByUserId(existingToken.userId)

    if (existingConfirmation) {
      await db.twoFactorConfirmation.delete({
        where: { id: existingConfirmation.id },
      })
    }

    await db.twoFactorConfirmation.create({
      data: {
        userId: existingToken.userId,
      },
    })

    return { success: "Two factor token verified!" }
  }

  static async updateSettings(values: z.infer<typeof SettingsSchema>, userId: string) {
    const user = await getUserById(userId)

    if (!user) {
      return { error: "Unauthorized" }
    }

    const validatedFields = SettingsSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Invalid fields" }
    }

    const { name, email, password, newPassword, isTwoFactorEnabled } = validatedFields.data

    if (email && email !== user.email) {
      const existingUser = await getUserByEmail(email)

      if (existingUser && existingUser.id !== user.id) {
        return { error: "Email already in use!" }
      }

      const verificationToken = await generateVerificationToken(email)
      await sendVerificationEmail(verificationToken.email, verificationToken.token)

      return { success: "Verification email sent!" }
    }

    if (password && newPassword && user.password) {
      const passwordsMatch = await bcrypt.compare(password, user.password)

      if (!passwordsMatch) {
        return { error: "Invalid password!" }
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      validatedFields.data.password = hashedPassword
      validatedFields.data.newPassword = undefined
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        ...validatedFields.data,
      },
    })

    return { success: "Settings updated!" }
  }

  static async twoFactorLogin(token: string, userId: string) {
    const existingToken = await db.twoFactorToken.findUnique({
      where: { token },
    })

    if (!existingToken) {
      return { error: "Invalid token!" }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
      return { error: "Token has expired!" }
    }

    if (existingToken.userId !== userId) {
      return { error: "Unauthorized!" }
    }

    const existingConfirmation = await getTwoFactorConfirmationByUserId(existingToken.userId)

    if (!existingConfirmation) {
      return { error: "Unauthorized!" }
    }

    await db.twoFactorToken.delete({
      where: { id: existingToken.id },
    })

    await db.twoFactorConfirmation.delete({
      where: { id: existingConfirmation.id },
    })

    return { success: "Logged in!" }
  }
}
