"use server"

import admin, { ServiceAccount } from "firebase-admin"

const serviceAccount: ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

export async function getFirebaseAdmin(): Promise<admin.app.App> {
  console.log("admin.apps.length", admin.apps.length)
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK")
    return await admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    return await admin.app();
  }
}
