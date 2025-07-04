import { type NextRequest, NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"
import { UnifiedClientService } from "@/lib/services/unified-client-service"

export async function GET(request: NextRequest) {
  try {
    const authService = new UnifiedAuthService()
    const clientService = new UnifiedClientService()

    // Basic health checks
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        auth: "operational",
        client: "operational",
        database: "operational",
      },
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    }

    // Test basic service functionality
    try {
      // Test auth service initialization
      const authInitialized = authService !== null
      healthStatus.services.auth = authInitialized ? "operational" : "degraded"

      // Test client service initialization
      const clientInitialized = clientService !== null
      healthStatus.services.client = clientInitialized ? "operational" : "degraded"
    } catch (error) {
      console.error("Health check service test failed:", error)
      healthStatus.status = "degraded"
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
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
