// Placeholder for schemas.ts
import * as z from "zod"

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

export const SettingsSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
    isTwoFactorEnabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false
      }
      return true
    },
    {
      message: "New password is required when changing password",
      path: ["newPassword"],
    },
  )
