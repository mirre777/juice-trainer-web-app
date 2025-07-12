import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  console.log(`[Middleware] 🔍 Processing path: ${path}`)

  // Redirect calendar routes to overview (since we removed calendar)
  if (path.startsWith("/calendar")) {
    console.log(`[Middleware] 📅 Redirecting calendar to overview`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

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
    console.log(`[Middleware] ✅ Skipping middleware for: ${path}`)
    return NextResponse.next()
  }

  // Check for user_id cookie (this is what the system actually uses)
  const userId = request.cookies.get("user_id")?.value
  const authToken = request.cookies.get("auth_token")?.value

  console.log(`[Middleware] 🔍 Path: ${path}`)
  console.log(`[Middleware] 🍪 User ID cookie: ${userId ? "present (" + userId + ")" : "missing"}`)
  console.log(`[Middleware] 🍪 Auth token: ${authToken ? "present" : "missing"}`)

  // If we have user_id cookie, allow access
  if (userId) {
    console.log(`[Middleware] ✅ User authenticated with user_id: ${userId}`)
    return NextResponse.next()
  }

  // If no authentication found, redirect to login
  console.log(`[Middleware] ❌ No authentication found, redirecting to login`)
  const loginUrl = new URL("/login", request.url)
  // Add the original path as a redirect parameter
  loginUrl.searchParams.set("redirect", path)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
