// implement delete user endpoint

import { type NextRequest, NextResponse } from "next/server"
import { deleteUser } from "@/lib/firebase/user-service"
import { getUserId } from "@/lib/utils/user"
import { signOut } from "@/lib/auth/auth-service"

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const result = await deleteUser(userId);
  await signOut()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}