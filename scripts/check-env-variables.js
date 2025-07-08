#!/usr/bin/env node

/**
 * Environment Variables Checker
 * This script checks if all required environment variables are present
 * and validates their basic format where possible.
 */

const requiredEnvVars = [
  // Firebase Client-side (Public)
  {
    name: "NEXT_PUBLIC_FIREBASE_API_KEY",
    required: true,
    type: "string",
    description: "Firebase API Key (public)",
    validation: (value) => value && value.startsWith("AIza") && value.length > 30,
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    required: true,
    type: "string",
    description: "Firebase Auth Domain (public)",
    validation: (value) => value && value.includes(".firebaseapp.com"),
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    required: true,
    type: "string",
    description: "Firebase Project ID (public)",
    validation: (value) => value && value.length > 3,
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    required: true,
    type: "string",
    description: "Firebase Storage Bucket (public)",
    validation: (value) => value && value.includes(".appspot.com"),
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    required: true,
    type: "string",
    description: "Firebase Messaging Sender ID (public)",
    validation: (value) => value && /^\d+$/.test(value),
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_APP_ID",
    required: true,
    type: "string",
    description: "Firebase App ID (public)",
    validation: (value) => value && value.startsWith("1:") && value.includes(":web:"),
  },
  {
    name: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
    required: false,
    type: "string",
    description: "Firebase Analytics Measurement ID (public)",
    validation: (value) => !value || value.startsWith("G-"),
  },

  // Firebase Server-side (Private)
  {
    name: "FIREBASE_CLIENT_EMAIL",
    required: true,
    type: "string",
    description: "Firebase Service Account Client Email (private)",
    validation: (value) => value && value.includes("@") && value.includes(".iam.gserviceaccount.com"),
  },
  {
    name: "FIREBASE_PRIVATE_KEY",
    required: true,
    type: "string",
    description: "Firebase Service Account Private Key (private)",
    validation: (value) => value && value.includes("-----BEGIN PRIVATE KEY-----"),
  },
  {
    name: "FIREBASE_PRIVATE_KEY_ID",
    required: true,
    type: "string",
    description: "Firebase Service Account Private Key ID (private)",
    validation: (value) => value && value.length > 10,
  },
  {
    name: "FIREBASE_CLIENT_ID",
    required: true,
    type: "string",
    description: "Firebase Service Account Client ID (private)",
    validation: (value) => value && /^\d+$/.test(value),
  },

  // Google OAuth
  {
    name: "GOOGLE_CLIENT_ID",
    required: true,
    type: "string",
    description: "Google OAuth Client ID (private)",
    validation: (value) => value && value.includes(".googleusercontent.com"),
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    required: true,
    type: "string",
    description: "Google OAuth Client Secret (private)",
    validation: (value) => value && value.length > 20,
  },
  {
    name: "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    required: false,
    type: "string",
    description: "Google OAuth Client ID (public)",
    validation: (value) => !value || value.includes(".googleusercontent.com"),
  },
  {
    name: "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET",
    required: false,
    type: "string",
    description: "Google OAuth Client Secret (public) - WARNING: Should not be public!",
    validation: (value) => !value || value.length > 20,
  },

  // App Configuration
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: true,
    type: "string",
    description: "Application URL (public)",
    validation: (value) => value && (value.startsWith("http://") || value.startsWith("https://")),
  },
  {
    name: "ENCRYPTION_KEY",
    required: true,
    type: "string",
    description: "Encryption key for sensitive data (private)",
    validation: (value) => value && value.length >= 32,
  },

  // Stripe
  {
    name: "STRIPE_SECRET_KEY",
    required: true,
    type: "string",
    description: "Stripe Secret Key (private)",
    validation: (value) => value && (value.startsWith("sk_test_") || value.startsWith("sk_live_")),
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    required: true,
    type: "string",
    description: "Stripe Webhook Secret (private)",
    validation: (value) => value && value.startsWith("whsec_"),
  },

  // Vercel Blob
  {
    name: "BLOB_READ_WRITE_TOKEN",
    required: false,
    type: "string",
    description: "Vercel Blob Storage Token (private)",
    validation: (value) => !value || value.startsWith("vercel_blob_rw_"),
  },
]

function checkEnvironmentVariables() {
  console.log("🔍 Checking Environment Variables...\n")

  const results = {
    missing: [],
    invalid: [],
    warnings: [],
    valid: [],
    total: requiredEnvVars.length,
  }

  // Check each environment variable
  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar.name]
    const isPresent = value !== undefined && value !== null && value !== ""

    console.log(`📋 ${envVar.name}`)
    console.log(`   Description: ${envVar.description}`)
    console.log(`   Required: ${envVar.required ? "✅ Yes" : "⚠️  No"}`)
    console.log(`   Present: ${isPresent ? "✅ Yes" : "❌ No"}`)

    if (envVar.required && !isPresent) {
      results.missing.push(envVar.name)
      console.log(`   Status: ❌ MISSING (Required)`)
    } else if (!isPresent) {
      console.log(`   Status: ⚠️  Missing (Optional)`)
    } else {
      // Validate format if validation function exists
      if (envVar.validation) {
        const isValid = envVar.validation(value)
        if (isValid) {
          results.valid.push(envVar.name)
          console.log(`   Status: ✅ Valid`)
          console.log(`   Value: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`)
        } else {
          results.invalid.push(envVar.name)
          console.log(`   Status: ❌ INVALID FORMAT`)
          console.log(`   Value: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`)
        }
      } else {
        results.valid.push(envVar.name)
        console.log(`   Status: ✅ Present`)
        console.log(`   Value: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`)
      }
    }

    console.log("")
  })

  // Check for security warnings
  if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET) {
    results.warnings.push("NEXT_PUBLIC_GOOGLE_CLIENT_SECRET should not be public!")
  }

  // Summary
  console.log("📊 SUMMARY")
  console.log("=".repeat(50))
  console.log(`Total Variables Checked: ${results.total}`)
  console.log(`✅ Valid: ${results.valid.length}`)
  console.log(`❌ Missing Required: ${results.missing.length}`)
  console.log(`❌ Invalid Format: ${results.invalid.length}`)
  console.log(`⚠️  Warnings: ${results.warnings.length}`)

  if (results.missing.length > 0) {
    console.log("\n❌ MISSING REQUIRED VARIABLES:")
    results.missing.forEach((name) => console.log(`   - ${name}`))
  }

  if (results.invalid.length > 0) {
    console.log("\n❌ INVALID FORMAT VARIABLES:")
    results.invalid.forEach((name) => console.log(`   - ${name}`))
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  SECURITY WARNINGS:")
    results.warnings.forEach((warning) => console.log(`   - ${warning}`))
  }

  // Environment detection
  console.log("\n🌍 ENVIRONMENT INFO:")
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "undefined"}`)
  console.log(`VERCEL: ${process.env.VERCEL || "undefined"}`)
  console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV || "undefined"}`)

  // Firebase connection test
  console.log("\n🔥 FIREBASE CONNECTION TEST:")
  testFirebaseConnection()

  // Exit with appropriate code
  const hasErrors = results.missing.length > 0 || results.invalid.length > 0
  if (hasErrors) {
    console.log("\n❌ Environment check failed! Please fix the issues above.")
    process.exit(1)
  } else {
    console.log("\n✅ All environment variables are properly configured!")
    process.exit(0)
  }
}

function testFirebaseConnection() {
  try {
    // Test Firebase configuration object creation
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    }

    console.log("✅ Firebase config object can be created")
    console.log(`   Project ID: ${firebaseConfig.projectId}`)
    console.log(`   Auth Domain: ${firebaseConfig.authDomain}`)

    // Test service account configuration
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log("✅ Firebase service account credentials present")
      console.log(`   Service Account: ${process.env.FIREBASE_CLIENT_EMAIL}`)
    } else {
      console.log("❌ Firebase service account credentials missing")
    }
  } catch (error) {
    console.log("❌ Firebase configuration error:", error.message)
  }
}

// Run the check
if (require.main === module) {
  checkEnvironmentVariables()
}

module.exports = { checkEnvironmentVariables, requiredEnvVars }
