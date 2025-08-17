import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { config as appConfig } from "@/lib/config"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the path matches the userId/workoutId pattern (two segments with no specific prefix)
  const pathSegments = path.split("/").filter(Boolean)
  const isSharedWorkoutPath =
    pathSegments.length === 2 &&
    // Simple validation that these could be Firebase IDs (alphanumeric with some special chars)
    /^[A-Za-z0-9_-]+$/.test(pathSegments[0]) &&
    /^[A-Za-z0-9_-]+$/.test(pathSegments[1])

  const isPublicPath =
    path === "/login" ||
    path === "/signup" ||
    path === "/signup-juice-app" ||
    path === "/mobile-app-success" ||
    path === "/payment-success" ||
    path === "/invite-app" ||
    path.startsWith("/images/") ||
    path.startsWith("/invite/") ||
    path.startsWith("/shared/") ||
    isSharedWorkoutPath || // Add this condition for direct userId/workoutId URLs
    path.startsWith("/api/invitations/") ||
    path.startsWith("/api/shared/") ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/demo/") // Demo routes remain public

  // Get the token from the cookies
  const authCookie = request.cookies.get("auth_token")
  const token = authCookie?.value

  console.log(`[Middleware] Path: ${path}`)
  console.log(`[Middleware] Is public path: ${isPublicPath}`)
  console.log(`[Middleware] Is shared workout path: ${isSharedWorkoutPath}`)
  console.log(`[Middleware] Auth cookie exists: ${!!authCookie}`)

  // Handle redirects from old invite URL format to new format
  const { pathname, searchParams } = request.nextUrl
  if (pathname.startsWith("/signup") && searchParams.has("invite")) {
    const inviteCode = searchParams.get("invite") || searchParams.get(appConfig.inviteCode)
    console.log(`[Middleware] Redirecting old invite format to new: /invite/${inviteCode}`)
    return NextResponse.redirect(`${request.nextUrl.origin}/invite/${inviteCode}`)
  }

  // Handle root path specifically
  if (path === "/") {
    if (token && token.trim() !== "") {
      console.log(`[Middleware] Redirecting from root to overview - authenticated user`)
      return NextResponse.redirect(new URL("/overview", request.url))
    } else {
      console.log(`[Middleware] Redirecting from root to login - unauthenticated user`)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // If the path is not public and there's no valid token, redirect to login
  if (!isPublicPath && (!token || token.trim() === "")) {
    console.log(`[Middleware] Redirecting to login - private path without valid token`)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login or signup and there's a valid token, redirect to dashboard
  // BUT allow login/signup with invite code to proceed regardless of token
  if ((path === "/login" || path === "/signup") && token && token.trim() !== "") {
    // Allow login/signup page if there's an invite code in the URL
    const inviteCode = searchParams.get(appConfig.inviteCode) || searchParams.get("invite")
    if (inviteCode) {
      console.log(`[Middleware] Allowing ${path} with invite code despite existing token`)
      return NextResponse.next()
    }

    console.log(`[Middleware] Redirecting to overview - auth page with valid token`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

  // For protected paths, we need to check if user has trainer role
  // This will be handled by a separate API call in the frontend for now
  // Later we can optimize this by including role in the JWT token

  console.log(`[Middleware] Allowing request to proceed`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
