import crypto from "crypto"
import { config } from "@/lib/config"
import { AppError, ErrorType, handleServerError, tryCatch } from "@/lib/utils/error-handler"

// Function to generate random string of specified length
export function generateRandomString(length = 16): string {
  console.log("generateRandomString - Starting with length:", length)

  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(length)
    window.crypto.getRandomValues(values)

    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length]
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
  }

  console.log("generateRandomString - Generated string:", result)
  console.log("generateRandomString - Result type:", typeof result)

  return result
}

// Encrypt a string using AES-256-CBC
export async function encrypt(text: string): Promise<string> {
  return tryCatch(
    () => {
      // Get the encryption key from environment variables
      const encryptionKey = config.encryptionKey || "fallback_key_for_development_only_32b"

      // Create a random initialization vector
      const iv = crypto.randomBytes(16)

      // Create cipher using the key and iv
      const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey), iv)

      // Encrypt the text
      let encrypted = cipher.update(text, "utf8", "hex")
      encrypted += cipher.final("hex")

      // Return the iv and encrypted data as a single string
      return `${iv.toString("hex")}:${encrypted}`
    },
    (error) => {
      throw handleServerError(error, {
        service: "CryptoUtils",
        operation: "encrypt",
        message: "Failed to encrypt data",
        errorType: ErrorType.INTERNAL_ERROR,
      })
    },
  )
}

// Decrypt a string using AES-256-CBC
export async function decrypt(encryptedText: string): Promise<string> {
  return tryCatch(
    () => {
      // Get the encryption key from environment variables
      const encryptionKey = config.encryptionKey || "fallback_key_for_development_only_32b"

      // Split the encrypted text into iv and data
      const [ivHex, encryptedData] = encryptedText.split(":")

      if (!ivHex || !encryptedData) {
        throw new AppError({
          message: "Invalid encrypted text format",
          errorType: ErrorType.VALIDATION_ERROR,
        })
      }

      // Convert the iv from hex to Buffer
      const iv = Buffer.from(ivHex, "hex")

      // Create decipher using the key and iv
      const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey), iv)

      // Decrypt the data
      let decrypted = decipher.update(encryptedData, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return decrypted
    },
    (error) => {
      throw handleServerError(error, {
        service: "CryptoUtils",
        operation: "decrypt",
        message: "Failed to decrypt data",
        errorType: ErrorType.INTERNAL_ERROR,
      })
    },
  )
}
