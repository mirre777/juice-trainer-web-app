import { AppError, ErrorType } from "@/lib/utils/error-handler"

// Application configuration
export const config = {
  // App
  appName: "Juice Fitness",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Authentication
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || "",

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",

  // Firebase
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Validate required configuration
  validate() {
    const requiredEnvVars = [
      { name: "GOOGLE_CLIENT_ID", value: this.googleClientId },
      { name: "GOOGLE_CLIENT_SECRET", value: this.googleClientSecret },
      { name: "ENCRYPTION_KEY", value: this.encryptionKey },
      { name: "NEXT_PUBLIC_FIREBASE_API_KEY", value: this.firebase.apiKey },
      { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: this.firebase.projectId },
    ]

    const missingVars = requiredEnvVars.filter((v) => !v.value).map((v) => v.name)

    if (missingVars.length > 0 && this.isProduction) {
      throw new AppError({
        message: `Missing required environment variables: ${missingVars.join(", ")}`,
        errorType: ErrorType.CONFIG_ERROR,
      })
    }

    if (missingVars.length > 0) {
      console.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}`)
    }

    return true
  },
}
