import { cookies } from "next/headers"

export async function getTrainerIdFromCookie() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userIdAlt = cookieStore.get("userId")?.value
  const trainerId = userId || userIdAlt
  return trainerId
}