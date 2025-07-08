import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/token-service"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }

    const tokenData = await verifyToken(token)

    return NextResponse.json({
      tokenExists: !!token,
      tokenPreview: token.substring(0, 20) + "...",
      tokenData,
      tokenDataType: typeof tokenData,
      isArray: Array.isArray(tokenData),
      arrayLength: Array.isArray(tokenData) ? tokenData.length : null,
      firstElement: Array.isArray(tokenData) ? tokenData[0] : null,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: "Token verification failed",
      details: error.message,
    })
  }
}
