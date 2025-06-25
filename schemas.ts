// Placeholder for schemas.ts
import { z } from "zod"

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export const SettingsSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional(),
  isTwoFactorEnabled: z.boolean().optional(),
})
