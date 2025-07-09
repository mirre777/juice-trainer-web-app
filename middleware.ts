import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

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
    return NextResponse.next()
  }

  // Check for user_id cookie
  const userId = request.cookies.get("user_id")?.value

  console.log(`[Middleware] Path: ${path}`)
  console.log(`[Middleware] User ID cookie: ${userId ? "present" : "missing"}`)

  if (!userId) {
    console.log(`[Middleware] No user_id cookie, redirecting to login`)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
