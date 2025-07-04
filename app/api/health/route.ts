import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"
import { UnifiedClientService } from "@/lib/services/unified-client-service"

export async function GET() {
  try {
    console.log("🏥 [Health Check] Starting health check...")

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        auth: "unknown",
        client: "unknown",
        database: "unknown",
      },
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    }

    // Test UnifiedAuthService
    try {
      const authResult = await UnifiedAuthService.getCurrentUser()
      healthStatus.services.auth = authResult.success ? "healthy" : "degraded"
    } catch (error) {
      console.error("[Health Check] Auth service error:", error)
      healthStatus.services.auth = "unhealthy"
    }

    // Test UnifiedClientService (this will fail if not authenticated, which is expected)
    try {
      const clientResult = await UnifiedClientService.getClients()
      healthStatus.services.client = clientResult.success ? "healthy" : "degraded"
    } catch (error) {
      console.error("[Health Check] Client service error:", error)
      healthStatus.services.client = "degraded" // Expected to fail without auth
    }

    // Test database connection
    try {
      const { db } = await import("@/lib/firebase/firebase")
      healthStatus.services.database = db ? "healthy" : "unhealthy"
    } catch (error) {
      console.error("[Health Check] Database connection error:", error)
      healthStatus.services.database = "unhealthy"
    }

    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services)
    if (serviceStatuses.includes("unhealthy")) {
      healthStatus.status = "unhealthy"
    } else if (serviceStatuses.includes("degraded")) {
      healthStatus.status = "degraded"
    }

    console.log("✅ [Health Check] Health check completed:", healthStatus.status)

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === "healthy" ? 200 : 503,
    })
  } catch (error) {
    console.error("💥 [Health Check] Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        services: {
          auth: "unknown",
          client: "unknown",
          database: "unknown",
        },
      },
      { status: 503 },
    )
  }
}
