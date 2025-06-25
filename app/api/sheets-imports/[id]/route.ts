import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { routeContextSchema } from "@/lib/validation/sheets-imports"

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = context

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = routeContextSchema.safeParse({
      id: params.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        {
          status: 400,
        },
      )
    }

    const { id } = result.data

    const sheetsImport = await db.sheetsImport.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!sheetsImport) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(sheetsImport)
  } catch (error) {
    console.error("[SHEETS_IMPORT_GET]", error)
    return NextResponse.json({ message: "Internal error", error }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = context

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = routeContextSchema.safeParse({
      id: params.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        {
          status: 400,
        },
      )
    }

    const { id } = result.data

    const sheetsImport = await db.sheetsImport.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!sheetsImport) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db.sheetsImport.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Sheets import deleted" })
  } catch (error) {
    console.error("[SHEETS_IMPORT_DELETE]", error)
    return NextResponse.json({ message: "Internal error", error }, { status: 500 })
  }
}
