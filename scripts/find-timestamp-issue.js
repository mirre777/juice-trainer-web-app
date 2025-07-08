console.log("=== DEBUGGING TIMESTAMP STORAGE ISSUE ===")

// Check what's in your client-service.ts addClient function
console.log("\n1. CHECKING CLIENT SERVICE addClient FUNCTION:")

const fs = require("fs")
const path = require("path")

try {
  const clientServicePath = path.join(__dirname, "../lib/firebase/client-service.ts")
  const clientServiceContent = fs.readFileSync(clientServicePath, "utf8")

  // Find the addClient function
  const addClientMatch = clientServiceContent.match(/export async function addClient\(([\s\S]*?)\n}/m)
  if (addClientMatch) {
    console.log("Found addClient function:")
    console.log(addClientMatch[0])
  }

  // Check for serverTimestamp usage
  const serverTimestampUsage = clientServiceContent.match(/serverTimestamp$$$$/g)
  console.log(`\nserverTimestamp() usage count: ${serverTimestampUsage ? serverTimestampUsage.length : 0}`)

  // Check for Timestamp.now() usage
  const timestampNowUsage = clientServiceContent.match(/Timestamp\.now$$$$/g)
  console.log(`Timestamp.now() usage count: ${timestampNowUsage ? timestampNowUsage.length : 0}`)
} catch (error) {
  console.error("Error reading client-service.ts:", error.message)
}

console.log("\n2. CHECKING API ROUTE /api/clients:")

try {
  const apiRoutePath = path.join(__dirname, "../app/api/clients/route.ts")
  const apiRouteContent = fs.readFileSync(apiRoutePath, "utf8")

  // Find POST method
  const postMethodMatch = apiRouteContent.match(/export async function POST\(([\s\S]*?)(?=export|$)/m)
  if (postMethodMatch) {
    console.log("Found POST method in /api/clients:")
    console.log(postMethodMatch[0].substring(0, 500) + "...")
  }
} catch (error) {
  console.error("Error reading API route:", error.message)
}

console.log("\n3. CHECKING PROGRAM CONVERSION SERVICE:")

try {
  const programServicePath = path.join(__dirname, "../lib/firebase/program-conversion-service.ts")
  const programServiceContent = fs.readFileSync(programServicePath, "utf8")

  // Check for timestamp creation patterns
  const timestampPatterns = [
    /createdAt:\s*([^,\n]+)/g,
    /startedAt:\s*([^,\n]+)/g,
    /updatedAt:\s*([^,\n]+)/g,
    /serverTimestamp$$$$/g,
    /Timestamp\.now$$$$/g,
    /new Date$$$$/g,
    /Date\.now$$$$/g,
  ]

  timestampPatterns.forEach((pattern, index) => {
    const matches = programServiceContent.match(pattern)
    if (matches) {
      console.log(`\nPattern ${index + 1} matches:`, matches)
    }
  })
} catch (error) {
  console.error("Error reading program-conversion-service.ts:", error.message)
}

console.log("\n=== ANALYSIS COMPLETE ===")
