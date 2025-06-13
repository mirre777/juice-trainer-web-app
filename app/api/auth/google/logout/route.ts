export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { clearTokens } from "@/lib/token-service"

export async function GET(request: NextRequest) {
  // Clear tokens from cookies
  clearTokens()

  // Redirect to the schedule page
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/demo/schedule?logout=true`)
}
