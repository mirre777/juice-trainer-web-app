import { NextResponse } from "next/server"
import { UnifiedClientService } from "@/lib/services/unified-client-service"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id

    console.log(`🔍 [API:clients/${clientId}] GET - Fetching client`)

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Use unified client service to get client
    const clientResult = await UnifiedClientService.getClient(clientId)

    if (!clientResult.success) {
      console.log(`❌ [API:clients/${clientId}] Failed to fetch client:`, clientResult.error?.message)

      const statusCode =
        clientResult.error?.errorType === "AUTH_UNAUTHORIZED"
          ? 401
          : clientResult.error?.errorType === "DB_DOCUMENT_NOT_FOUND"
            ? 404
            : 500

      return NextResponse.json(
        {
          error: clientResult.error?.message || "Failed to fetch client",
          client: null,
        },
        { status: statusCode },
      )
    }

    console.log(`✅ [API:clients/${clientId}] Successfully fetched client: ${clientResult.client?.name}`)

    return NextResponse.json({
      success: true,
      client: clientResult.client,
    })
  } catch (error: any) {
    console.error(`💥 [API:clients/${params.id}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        client: null,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id
    const updates = await request.json()

    console.log(`📝 [API:clients/${clientId}] PUT - Updating client`)

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Use unified client service to update client
    const clientResult = await UnifiedClientService.updateClient(clientId, updates)

    if (!clientResult.success) {
      console.log(`❌ [API:clients/${clientId}] Failed to update client:`, clientResult.error?.message)

      const statusCode =
        clientResult.error?.errorType === "AUTH_UNAUTHORIZED"
          ? 401
          : clientResult.error?.errorType === "DB_DOCUMENT_NOT_FOUND"
            ? 404
            : 500

      return NextResponse.json(
        {
          error: clientResult.error?.message || "Failed to update client",
          success: false,
        },
        { status: statusCode },
      )
    }

    console.log(`✅ [API:clients/${clientId}] Successfully updated client`)

    return NextResponse.json({
      success: true,
      message: clientResult.message || "Client updated successfully",
    })
  } catch (error: any) {
    console.error(`💥 [API:clients/${params.id}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id

    console.log(`🗑️ [API:clients/${clientId}] DELETE - Deleting client`)

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Use unified client service to delete client
    const clientResult = await UnifiedClientService.deleteClient(clientId)

    if (!clientResult.success) {
      console.log(`❌ [API:clients/${clientId}] Failed to delete client:`, clientResult.error?.message)

      const statusCode =
        clientResult.error?.errorType === "AUTH_UNAUTHORIZED"
          ? 401
          : clientResult.error?.errorType === "DB_DOCUMENT_NOT_FOUND"
            ? 404
            : 500

      return NextResponse.json(
        {
          error: clientResult.error?.message || "Failed to delete client",
          success: false,
        },
        { status: statusCode },
      )
    }

    console.log(`✅ [API:clients/${clientId}] Successfully deleted client`)

    return NextResponse.json({
      success: true,
      message: clientResult.message || "Client deleted successfully",
    })
  } catch (error: any) {
    console.error(`💥 [API:clients/${params.id}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
