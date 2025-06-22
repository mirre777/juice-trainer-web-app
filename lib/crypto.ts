// Simple encryption/decryption utility for tokens
import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

// Use a secure environment variable for the encryption key
// In production, this should be a strong, randomly generated key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-for-development-only"

// Encrypt data
export async function encrypt(text: string): Promise<string> {
  try {
    const iv = randomBytes(16)
    // Ensure the key is exactly 32 bytes (256 bits) for AES-256
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32))

    const cipher = createCipheriv("aes-256-cbc", key, iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    return `${iv.toString("hex")}:${encrypted}`
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

// Decrypt data
export async function decrypt(text: string): Promise<string> {
  try {
    const [ivHex, encryptedText] = text.split(":")
    if (!ivHex || !encryptedText) {
      throw new Error("Invalid encrypted text format")
    }

    const iv = Buffer.from(ivHex, "hex")
    // Ensure the key is exactly 32 bytes (256 bits) for AES-256
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32))

    const decipher = createDecipheriv("aes-256-cbc", key, iv)
    let decrypted = decipher.update(encryptedText, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}
