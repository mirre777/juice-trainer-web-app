import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes (except auth check), and public pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/invite" ||
    pathname.startsWith("/invite/") ||
    pathname === "/" ||
    pathname.startsWith("/shared/") ||
    pathname.startsWith("/demo/") ||
    pathname === "/debug-env"
  ) {
    return NextResponse.next()
  }

  // Check for user_id cookie
  const userId = request.cookies.get("user_id")?.value

  console.log(`[Middleware] Path: ${pathname}`)
  console.log(`[Middleware] User ID cookie: ${userId ? "present" : "missing"}`)

  if (!userId) {
    console.log(`[Middleware] No user_id cookie, redirecting to login`)
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
