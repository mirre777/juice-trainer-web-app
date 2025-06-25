import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { type AppError, createError, ErrorType } from "@/lib/utils/error-handler"

export const dynamic = "force-dynamic"

export async function POST(_: NextRequest, { params }: { params: { code: string } }): Promise<NextResponse> {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { code } = params

    if (!code) {
      throw createError(ErrorType.BadRequest, "Missing invitation code")
    }

    // 1. Verify the invitation code
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .select("id, email, organization_id")
      .eq("code", code)
      .single()

    if (invitationError) {
      throw createError(ErrorType.InternalServerError, `Failed to verify invitation code: ${invitationError.message}`)
    }

    if (!invitation) {
      throw createError(ErrorType.NotFound, "Invalid invitation code")
    }

    // 2. Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw createError(ErrorType.InternalServerError, `Failed to get user: ${userError.message}`)
    }

    if (!user) {
      throw createError(ErrorType.Unauthorized, "Unauthorized")
    }

    // 3. Check if the user's email matches the invitation email
    if (user.email !== invitation.email) {
      throw createError(ErrorType.Forbidden, "Email does not match invitation")
    }

    // 4. Add the user to the organization
    const { error: orgUserError } = await supabaseAdmin.from("organization_users").insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
    })

    if (orgUserError) {
      throw createError(ErrorType.InternalServerError, `Failed to add user to organization: ${orgUserError.message}`)
    }

    // 5. Invalidate the invitation
    const { error: invalidateError } = await supabaseAdmin
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id)

    if (invalidateError) {
      throw createError(ErrorType.InternalServerError, `Failed to invalidate invitation: ${invalidateError.message}`)
    }

    return NextResponse.json({ message: "Invitation accepted" }, { status: 200 })
  } catch (error) {
    console.error(error)
    const appError = error as AppError
    return NextResponse.json({ message: appError.message }, { status: appError.status })
  }
}
