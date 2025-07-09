import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and public paths
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/",
    "/pricing",
    "/invite",
    "/shared",
    "/mobile-app-success",
    "/signup-juice-app",
    "/debug-env",
  ]

  // Check if current path is public or starts with public path
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") return pathname === "/"
    return pathname.startsWith(route)
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for user_id cookie
  const userId = request.cookies.get("user_id")?.value

  console.log(`[Middleware] Path: ${pathname}, User ID: ${userId ? "present" : "missing"}`)

  if (!userId) {
    console.log(`[Middleware] No user_id cookie found, redirecting to login`)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
