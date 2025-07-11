import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  console.log(`🔒 [Middleware] Processing path: ${path}`)

  // Skip middleware for static files, API routes, and public paths
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/static") ||
    path.includes(".") ||
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path === "/pricing" ||
    path.startsWith("/invite/") ||
    path.startsWith("/shared/") ||
    path.startsWith("/demo/") ||
    path === "/debug-env" ||
    path === "/mobile-app-success" ||
    path === "/signup-juice-app"
  ) {
    console.log(`🔒 [Middleware] Skipping auth check for: ${path}`)
    return NextResponse.next()
  }

  // Check for user_id cookie
  const userId = request.cookies.get("user_id")?.value
  const authToken = request.cookies.get("auth_token")?.value

  console.log(`🔒 [Middleware] Path: ${path}`)
  console.log(`🔒 [Middleware] User ID cookie: ${userId ? "present" : "missing"}`)
  console.log(`🔒 [Middleware] Auth token: ${authToken ? "present" : "missing"}`)

  // If no authentication found, redirect to login
  if (!userId && !authToken) {
    console.log(`🔒 [Middleware] No authentication found, redirecting to login`)
    const loginUrl = new URL("/login", request.url)
    // Add the original path as a redirect parameter
    loginUrl.searchParams.set("redirect", path)
    return NextResponse.redirect(loginUrl)
  }

  console.log(`🔒 [Middleware] Authentication found, allowing access to: ${path}`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
