import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path === "/signup-juice-app" ||
    path === "/mobile-app-success" ||
    path === "/payment-success" ||
    path === "/invite-app" ||
    path.startsWith("/invite/") ||
    path.startsWith("/shared/") ||
    isSharedWorkoutPath || // Add this condition for direct userId/workoutId URLs
    path.startsWith("/api/invitations/") ||
    path.startsWith("/api/shared/") ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/demo/") || // Demo routes remain public
    path.startsWith("/debug-env") // Allow debug page

  // Get the token from the cookies
  const authCookie =
    request.cookies.get("auth-token") || request.cookies.get("auth_token") || request.cookies.get("session_token")
  const token = authCookie?.value
  const userId = request.cookies.get("user_id")?.value

  console.log(`[Middleware] Path: ${path}`)
  console.log(`[Middleware] Is public path: ${isPublicPath}`)
  console.log(`[Middleware] Is shared workout path: ${isSharedWorkoutPath}`)
  console.log(`[Middleware] Auth cookie exists: ${!!authCookie}`)
  console.log(`[Middleware] User ID cookie: ${userId ? "Present" : "Missing"}`)

  // Handle redirects from old invite URL format to new format
  const { pathname, searchParams } = request.nextUrl
  if (pathname.startsWith("/signup") && searchParams.has("invite")) {
    const inviteCode = searchParams.get("invite")
    console.log(`[Middleware] Redirecting old invite format to new: /invite/${inviteCode}`)
    return NextResponse.redirect(`${request.nextUrl.origin}/invite/${inviteCode}`)
  }

  // If the path is not public and there's no valid token or user ID, redirect to login
  if (!isPublicPath && (!token || token.trim() === "") && !userId) {
    console.log(`[Middleware] Redirecting to login - private path without valid authentication`)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login or signup and there's a valid token, redirect to overview
  // BUT allow login/signup with invite code to proceed regardless of token
  if (((path === "/login" || path === "/signup") && token && token.trim() !== "") || userId) {
    // Allow login/signup page if there's an invite code in the URL
    if (searchParams.has("code")) {
      console.log(`[Middleware] Allowing ${path} with invite code despite existing token`)
      return NextResponse.next()
    }

    console.log(`[Middleware] Redirecting to overview - auth page with valid token`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

  // If the path is root (/) and there's a valid token, redirect to overview
  if (path === "/" && ((token && token.trim() !== "") || userId)) {
    console.log(`[Middleware] Redirecting from root to overview - authenticated user`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

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
