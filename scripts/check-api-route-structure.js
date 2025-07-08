import fs from "fs"
import path from "path"

function checkAPIRouteStructure() {
  console.log("🔍 Checking API route file structure...\n")

  const routePath = "app/api/programs/send-to-client/route.ts"

  try {
    // Check if file exists
    if (!fs.existsSync(routePath)) {
      console.log("❌ Route file does NOT exist at:", routePath)
      console.log("📁 Checking if directory exists...")

      const dirPath = path.dirname(routePath)
      if (!fs.existsSync(dirPath)) {
        console.log("❌ Directory does NOT exist:", dirPath)
        console.log("🔧 You need to create the directory and file")
      } else {
        console.log("✅ Directory exists but file is missing")
        console.log("🔧 You need to create the route.ts file")
      }
      return
    }

    console.log("✅ Route file exists at:", routePath)

    // Read and analyze the file
    const fileContent = fs.readFileSync(routePath, "utf8")

    console.log("\n📋 File Analysis:")
    console.log("📏 File size:", fileContent.length, "characters")

    // Check for required exports
    const hasPostExport = fileContent.includes("export async function POST")
    const hasNextRequest = fileContent.includes("NextRequest")
    const hasNextResponse = fileContent.includes("NextResponse")

    console.log("✅ Has POST export:", hasPostExport)
    console.log("✅ Imports NextRequest:", hasNextRequest)
    console.log("✅ Imports NextResponse:", hasNextResponse)

    if (!hasPostExport) {
      console.log("❌ Missing POST function export!")
      console.log("🔧 The file must export: export async function POST(request: NextRequest)")
    }

    // Check for key functions
    const hasGetCurrentUser = fileContent.includes("getCurrentUser")
    const hasProgramConversion = fileContent.includes("programConversionService")

    console.log("✅ Uses getCurrentUser:", hasGetCurrentUser)
    console.log("✅ Uses programConversionService:", hasProgramConversion)

    // Show first few lines for debugging
    console.log("\n📄 First 10 lines of file:")
    const lines = fileContent.split("\n").slice(0, 10)
    lines.forEach((line, index) => {
      console.log(`${index + 1}: ${line}`)
    })
  } catch (error) {
    console.error("❌ Error reading route file:", error.message)
  }
}

// Check Next.js app structure
function checkNextJSStructure() {
  console.log("\n🏗️ Checking Next.js App Router structure...\n")

  const appDir = "app"
  const apiDir = "app/api"
  const programsDir = "app/api/programs"

  console.log("✅ app/ directory exists:", fs.existsSync(appDir))
  console.log("✅ app/api/ directory exists:", fs.existsSync(apiDir))
  console.log("✅ app/api/programs/ directory exists:", fs.existsSync(programsDir))

  if (fs.existsSync(apiDir)) {
    console.log("\n📁 API routes found:")
    const apiRoutes = fs
      .readdirSync(apiDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    apiRoutes.forEach((route) => {
      console.log(`  - /api/${route}`)
    })
  }
}

// Run all checks
function runAllChecks() {
  checkNextJSStructure()
  checkAPIRouteStructure()
}

runAllChecks()
