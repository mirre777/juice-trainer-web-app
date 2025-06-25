import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const { getUser } = getKindeServerSession()
    const user = getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { code } = params

    if (!code) {
      return new NextResponse("Missing code", { status: 400 })
    }

    const invitation = await db.invitation.findUnique({
      where: {
        code,
      },
    })

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 })
    }

    if (invitation.email !== user.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organization = await db.organization.findUnique({
      where: {
        id: invitation.organizationId,
      },
    })

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 })
    }

    await db.organization.update({
      where: {
        id: organization.id,
      },
      data: {
        users: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    await db.invitation.delete({
      where: {
        code,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[INVITATION_ACCEPT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
