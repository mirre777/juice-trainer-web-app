#!/usr/bin/env node

const requiredEnvVars = {
  // Firebase Client-side (Public)
  NEXT_PUBLIC_FIREBASE_API_KEY: {
    description: "Firebase API Key (public)",
    validate: (value) => value && value.startsWith("AIza") && value.length > 30,
    isPublic: true,
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {
    description: "Firebase Auth Domain (public)",
    validate: (value) => value && value.includes(".firebaseapp.com"),
    isPublic: true,
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
    description: "Firebase Project ID (public)",
    validate: (value) => value && value.length > 3,
    isPublic: true,
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {
    description: "Firebase Storage Bucket (public)",
    validate: (value) => value && value.includes(".appspot.com"),
    isPublic: true,
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: {
    description: "Firebase Messaging Sender ID (public)",
    validate: (value) => value && /^\d+$/.test(value),
    isPublic: true,
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_APP_ID: {
    description: "Firebase App ID (public)",
    validate: (value) => value && value.startsWith("1:") && value.includes(":web:"),
    isPublic: true,
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: {
    description: "Firebase Analytics Measurement ID (public)",
    validate: (value) => !value || value.startsWith("G-"),
    isPublic: true,
    required: false,
  },

  // Firebase Server-side (Private)
  FIREBASE_CLIENT_EMAIL: {
    description: "Firebase Service Account Client Email (private)",
    validate: (value) => value && value.includes("@") && value.includes(".iam.gserviceaccount.com"),
    isPublic: false,
    required: true,
  },
  FIREBASE_PRIVATE_KEY: {
    description: "Firebase Service Account Private Key (private)",
    validate: (value) => value && value.includes("-----BEGIN PRIVATE KEY-----"),
    isPublic: false,
    required: true,
  },
  FIREBASE_PRIVATE_KEY_ID: {
    description: "Firebase Service Account Private Key ID (private)",
    validate: (value) => value && value.length > 10,
    isPublic: false,
    required: true,
  },
  FIREBASE_CLIENT_ID: {
    description: "Firebase Service Account Client ID (private)",
    validate: (value) => value && /^\d+$/.test(value),
    isPublic: false,
    required: true,
  },

  // Google OAuth
  GOOGLE_CLIENT_ID: {
    description: "Google OAuth Client ID (private)",
    validate: (value) => value && value.includes(".googleusercontent.com"),
    isPublic: false,
    required: true,
  },
  GOOGLE_CLIENT_SECRET: {
    description: "Google OAuth Client Secret (private)",
    validate: (value) => value && value.length > 20,
    isPublic: false,
    required: true,
  },
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: {
    description: "Google OAuth Client ID (public)",
    validate: (value) => !value || value.includes(".googleusercontent.com"),
    isPublic: true,
    required: false,
  },
  NEXT_PUBLIC_GOOGLE_CLIENT_SECRET: {
    description: "Google OAuth Client Secret (public) - WARNING: Should not be public!",
    validate: (value) => !value || value.length > 20,
    isPublic: true,
    required: false,
  },

  // App Configuration
  NEXT_PUBLIC_APP_URL: {
    description: "Application URL (public)",
    validate: (value) => value && (value.startsWith("http://") || value.startsWith("https://")),
    isPublic: true,
    required: true,
  },
  ENCRYPTION_KEY: {
    description: "Encryption key for sensitive data (private)",
    validate: (value) => value && value.length >= 32,
    isPublic: false,
    required: true,
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    description: "Stripe Secret Key (private)",
    validate: (value) => value && (value.startsWith("sk_test_") || value.startsWith("sk_live_")),
    isPublic: false,
    required: true,
  },
  STRIPE_WEBHOOK_SECRET: {
    description: "Stripe Webhook Secret (private)",
    validate: (value) => value && value.startsWith("whsec_"),
    isPublic: false,
    required: true,
  },

  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: {
    description: "Vercel Blob Storage Token (private)",
    validate: (value) => !value || value.startsWith("vercel_blob_rw_"),
    isPublic: false,
    required: false,
  },
}

function checkEnvironmentVariables() {
  console.log("🔍 Checking Environment Variables...\n")

  const results = {
    missing: [],
    invalid: [],
    warnings: [],
    valid: [],
    total: Object.keys(requiredEnvVars).length,
  }

  // Check if we're in a Vercel environment
  const isVercel = process.env.VERCEL === "1"
  const isProduction = process.env.NODE_ENV === "production"

  console.log(`🌐 Environment: ${isVercel ? "Vercel" : "Local"}`)
  console.log(`🏗️  Mode: ${isProduction ? "Production" : "Development"}`)
  console.log(`📦 Node.js: ${process.version}`)
  console.log("")

  // Check each environment variable
  Object.entries(requiredEnvVars).forEach(([envVarName, envVarConfig]) => {
    const value = process.env[envVarName]
    const isPresent = value !== undefined && value !== null && value !== ""

    console.log(`📋 ${envVarName}`)
    console.log(`   Description: ${envVarConfig.description}`)
    console.log(`   Required: ${envVarConfig.required ? "✅ Yes" : "⚠️  Optional"}`)
    console.log(`   Type: ${envVarConfig.isPublic ? "Public" : "Private"}`)
    console.log(`   Present: ${isPresent ? "✅ Yes" : "❌ No"}`)

    if (envVarConfig.required && !isPresent) {
      results.missing.push(envVarName)
      console.log(`   Status: ❌ MISSING (Required)`)
    } else if (!isPresent) {
      console.log(`   Status: ⚠️  Missing (Optional)`)
    } else {
      // Validate format if validation function exists
      if (envVarConfig.validate) {
        const isValid = envVarConfig.validate(value)
        if (isValid) {
          results.valid.push(envVarName)
          console.log(`   Status: ✅ Valid`)
          // Show partial value for debugging (but not full secrets)
          if (envVarConfig.isPublic || envVarName.includes("URL") || envVarName.includes("DOMAIN")) {
            console.log(`   Value: ${value}`)
          } else {
            console.log(`   Value: ${value.substring(0, 10)}...${value.substring(value.length - 4)}`)
          }
        } else {
          results.invalid.push(envVarName)
          console.log(`   Status: ❌ INVALID FORMAT`)
          console.log(`   Value: ${value.substring(0, 20)}${value.length > 20 ? "..." : ""}`)
        }
      } else {
        results.valid.push(envVarName)
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
    console.log("\n💡 To fix missing variables:")
    console.log("   1. Add them to your .env.local file (for local development)")
    console.log("   2. Add them to your Vercel environment variables (for production)")
    console.log("   3. Make sure they match the expected format")
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
  console.log(`VERCEL_URL: ${process.env.VERCEL_URL || "undefined"}`)

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

      // Check private key format
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
      if (privateKey.includes("\\n")) {
        console.log("✅ Private key contains escaped newlines (correct format)")
      } else if (privateKey.includes("\n")) {
        console.log("✅ Private key contains actual newlines")
      } else {
        console.log("⚠️  Private key format might be incorrect (no newlines detected)")
      }
    } else {
      console.log("❌ Firebase service account credentials missing")
    }
  } catch (error) {
    console.log("❌ Firebase configuration error:", error.message)
  }
}

// Run the check
checkEnvironmentVariables()
