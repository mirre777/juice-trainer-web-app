#!/usr/bin/env node

console.log("🔍 Checking Environment Variables...\n")

// Required environment variables
const requiredVars = {
  // Firebase Client Config
  NEXT_PUBLIC_FIREBASE_API_KEY: {
    required: true,
    type: "public",
    validation: (val) => val && val.startsWith("AIza"),
    description: "Firebase API Key (should start with AIza)",
  },
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {
    required: true,
    type: "public",
    validation: (val) => val && val.includes(".firebaseapp.com"),
    description: "Firebase Auth Domain (should end with .firebaseapp.com)",
  },
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
    required: true,
    type: "public",
    validation: (val) => val && val.length > 0,
    description: "Firebase Project ID",
  },
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {
    required: true,
    type: "public",
    validation: (val) => val && val.includes(".appspot.com"),
    description: "Firebase Storage Bucket",
  },
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: {
    required: true,
    type: "public",
    validation: (val) => val && /^\d+$/.test(val),
    description: "Firebase Messaging Sender ID (should be numeric)",
  },
  NEXT_PUBLIC_FIREBASE_APP_ID: {
    required: true,
    type: "public",
    validation: (val) => val && val.startsWith("1:"),
    description: "Firebase App ID (should start with 1:)",
  },
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: {
    required: false,
    type: "public",
    validation: (val) => !val || val.startsWith("G-"),
    description: "Firebase Measurement ID (optional, should start with G-)",
  },

  // Firebase Server Config
  FIREBASE_CLIENT_EMAIL: {
    required: true,
    type: "private",
    validation: (val) => val && val.includes("@") && val.includes(".iam.gserviceaccount.com"),
    description: "Firebase Service Account Email",
  },
  FIREBASE_PRIVATE_KEY: {
    required: true,
    type: "private",
    validation: (val) => val && val.includes("-----BEGIN PRIVATE KEY-----"),
    description: "Firebase Private Key",
  },
  FIREBASE_PRIVATE_KEY_ID: {
    required: false,
    type: "private",
    validation: (val) => !val || val.length > 0,
    description: "Firebase Private Key ID (optional)",
  },
  FIREBASE_CLIENT_ID: {
    required: false,
    type: "private",
    validation: (val) => !val || /^\d+$/.test(val),
    description: "Firebase Client ID (optional, should be numeric)",
  },

  // Google OAuth
  GOOGLE_CLIENT_ID: {
    required: false,
    type: "private",
    validation: (val) => !val || val.includes(".googleusercontent.com"),
    description: "Google OAuth Client ID",
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    type: "private",
    validation: (val) => !val || val.length > 10,
    description: "Google OAuth Client Secret",
  },
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: {
    required: false,
    type: "public",
    validation: (val) => !val || val.includes(".googleusercontent.com"),
    description: "Public Google OAuth Client ID",
  },

  // App Config
  NEXT_PUBLIC_APP_URL: {
    required: true,
    type: "public",
    validation: (val) => val && (val.startsWith("http://") || val.startsWith("https://")),
    description: "Application URL",
  },
  ENCRYPTION_KEY: {
    required: true,
    type: "private",
    validation: (val) => val && val.length >= 32,
    description: "Encryption Key (should be at least 32 characters)",
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    required: false,
    type: "private",
    validation: (val) => !val || val.startsWith("sk_"),
    description: "Stripe Secret Key (should start with sk_)",
  },
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    type: "private",
    validation: (val) => !val || val.startsWith("whsec_"),
    description: "Stripe Webhook Secret (should start with whsec_)",
  },

  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: {
    required: false,
    type: "private",
    validation: (val) => !val || val.startsWith("vercel_blob_rw_"),
    description: "Vercel Blob Token",
  },
}

let hasErrors = false
let hasWarnings = false

console.log("📋 Environment Variable Status:\n")

Object.entries(requiredVars).forEach(([varName, config]) => {
  const value = process.env[varName]
  const exists = value !== undefined && value !== ""

  let status = "✅"
  let message = "OK"

  if (config.required && !exists) {
    status = "❌"
    message = "MISSING (Required)"
    hasErrors = true
  } else if (!config.required && !exists) {
    status = "⚠️ "
    message = "MISSING (Optional)"
    hasWarnings = true
  } else if (exists && !config.validation(value)) {
    status = "❌"
    message = "INVALID FORMAT"
    hasErrors = true
  }

  const typeIndicator = config.type === "public" ? "🌐" : "🔒"
  const valuePreview = exists ? (config.type === "private" ? `${value.substring(0, 10)}...` : value) : "Not set"

  console.log(`${status} ${typeIndicator} ${varName}`)
  console.log(`   Status: ${message}`)
  console.log(`   Description: ${config.description}`)
  if (exists && config.type === "public") {
    console.log(`   Value: ${valuePreview}`)
  }
  console.log("")
})

// Security warnings
console.log("🔒 Security Check:\n")

const publicSecrets = [
  "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET",
  "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_STRIPE_SECRET_KEY",
]

publicSecrets.forEach((secretVar) => {
  if (process.env[secretVar]) {
    console.log(`❌ SECURITY WARNING: ${secretVar} should not be public!`)
    hasErrors = true
  }
})

// Summary
console.log("📊 Summary:\n")

if (hasErrors) {
  console.log("❌ Configuration has ERRORS that need to be fixed")
  process.exit(1)
} else if (hasWarnings) {
  console.log("⚠️  Configuration has warnings but should work")
  process.exit(0)
} else {
  console.log("✅ All environment variables are properly configured")
  process.exit(0)
}
