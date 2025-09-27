import { cookies } from "next/headers"
import { getFirebaseAdmin } from "@/lib/firebase/firebase-admin";
import { NextRequest } from "next/server";

export async function getTrainerIdFromCookie() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userIdAlt = cookieStore.get("userId")?.value
  const trainerId = userId || userIdAlt
  return trainerId
}

export async function getUserIdFromCookie() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userIdAlt = cookieStore.get("userId")?.value
  return userId || userIdAlt
}

export async function getUserId(request: NextRequest): Promise<string | null> {
  const authToken = request.headers.get("Authorization")?.split(" ")[1];
  if (!authToken) {
    return null;
  }
  console.log("authToken", authToken);
  const admin = await getFirebaseAdmin()
  const decodedToken = await admin.auth().verifyIdToken(authToken);
  console.log("decodedToken", decodedToken);
  return decodedToken.uid;
}