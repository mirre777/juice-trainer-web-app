import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the path matches the userId/workoutId pattern
  const pathSegments = path.split("/").filter(Boolean)
  const isSharedWorkoutPath =
    pathSegments.length === 2 && /^[A-Za-z0-9_-]+$/.test(pathSegments[0]) && /^[A-Za-z0-9_-]+$/.test(pathSegments[1])

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
    isSharedWorkoutPath ||
    path.startsWith("/api/invitations/") ||
    path.startsWith("/api/shared/") ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/demo/") ||
    path.startsWith("/debug-env")

  // Get user_id cookie (simplified approach)
  const userId = request.cookies.get("user_id")?.value

  console.log(`[Middleware] Path: ${path}`)
  console.log(`[Middleware] Is public path: ${isPublicPath}`)
  console.log(`[Middleware] User ID exists: ${!!userId}`)

  // Handle old invite URL format
  const { pathname, searchParams } = request.nextUrl
  if (pathname.startsWith("/signup") && searchParams.has("invite")) {
    const inviteCode = searchParams.get("invite")
    console.log(`[Middleware] Redirecting old invite format to: /invite/${inviteCode}`)
    return NextResponse.redirect(`${request.nextUrl.origin}/invite/${inviteCode}`)
  }

  // Redirect unauthenticated users from private paths
  if (!isPublicPath && !userId) {
    console.log(`[Middleware] Redirecting to login - no user_id cookie found`)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Handle authenticated users on auth pages
  if ((path === "/login" || path === "/signup") && userId) {
    // Allow if there's an invite code
    if (searchParams.has("code")) {
      console.log(`[Middleware] Allowing ${path} with invite code`)
      return NextResponse.next()
    }

    console.log(`[Middleware] Authenticated user on auth page, redirecting to overview`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

  // Redirect authenticated users from root to overview
  if (path === "/" && userId) {
    console.log(`[Middleware] Redirecting authenticated user from root to overview`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

  // Don't redirect trainers to mobile-app-success
  if (path === "/mobile-app-success" && userId) {
    console.log(`[Middleware] Authenticated user trying to access mobile-app-success, redirecting to overview`)
    return NextResponse.redirect(new URL("/overview", request.url))
  }

  console.log(`[Middleware] Allowing request to proceed`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
