// Placeholder for lib/validations/program.ts
import { z } from "zod"

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  // Add other program fields as needed
})
