import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createError, ErrorType } from "@/lib/utils/error-handler"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(createError(ErrorType.Unauthorized, "Unauthorized"), { status: 401 })
    }

    const sheetImport = await db.sheetsImport.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!sheetImport) {
      return NextResponse.json(createError(ErrorType.NotFound, "Sheet import not found"), { status: 404 })
    }

    return NextResponse.json(sheetImport)
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(createError(ErrorType.InternalServerError, error.message), { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(createError(ErrorType.Unauthorized, "Unauthorized"), { status: 401 })
    }

    const sheetImport = await db.sheetsImport.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!sheetImport) {
      return NextResponse.json(createError(ErrorType.NotFound, "Sheet import not found"), { status: 404 })
    }

    await db.sheetsImport.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Sheet import deleted" })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(createError(ErrorType.InternalServerError, error.message), { status: 500 })
  }
}
