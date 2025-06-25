// Placeholder for lib/validation/sheets-imports.ts
import { z } from "zod"

export const routeContextSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
})
