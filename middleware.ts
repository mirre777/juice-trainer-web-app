import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = [
  "/overview",
  "/clients",
  "/programs",
  "/calendar",
  "/sessions",
  "/finance",
  "/settings",
  "/import-programs",
]

// Routes that require specific roles
const trainerOnlyRoutes = ["/clients", "/programs", "/calendar", "/sessions", "/finance", "/import-programs"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and public routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/pricing" ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/shared/") ||
    pathname.startsWith("/invite/")
  ) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  console.log(`[Middleware] Checking authentication for: ${pathname}`)

  // Get user_id cookie (simplified approach)
  const userIdCookie = request.cookies.get("user_id")

  if (!userIdCookie?.value) {
    console.log(`[Middleware] No user_id cookie found, redirecting to login`)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log(`[Middleware] User authenticated: ${userIdCookie.value}`)

  // For trainer-only routes, we'll let the page component handle role checking
  // since we'd need to fetch user data from Firestore to check the role
  // and middleware should be lightweight

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
