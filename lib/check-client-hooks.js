// Script to check for client-side hooks in server components
const fs = require("fs")
const path = require("path")
const glob = require("glob")

// List of hooks that should only be used in client components
const clientOnlyHooks = [
  "useToast",
  "useRouter",
  "usePathname",
  "useSearchParams",
  // Add other client-only hooks here
]

// Function to check if a file contains client-only hooks
function checkFileForClientHooks(filePath) {
  const content = fs.readFileSync(filePath, "utf8")

  // Skip if the file has "use client" directive
  if (content.includes('"use client"') || content.includes("'use client'")) {
    return null
  }

  // Check for each client-only hook
  const issues = []
  clientOnlyHooks.forEach((hook) => {
    if (content.includes(hook)) {
      issues.push(hook)
    }
  })

  if (issues.length > 0) {
    return {
      file: filePath,
      hooks: issues,
    }
  }

  return null
}

// Find all TypeScript and TypeScript React files
const files = glob.sync("app/**/*.{ts,tsx}", { ignore: ["**/node_modules/**", "**/*.d.ts"] })
files.push(...glob.sync("components/**/*.{ts,tsx}", { ignore: ["**/node_modules/**", "**/*.d.ts"] }))

// Check each file
const issues = []
files.forEach((file) => {
  const result = checkFileForClientHooks(file)
  if (result) {
    issues.push(result)
  }
})

// Print results
if (issues.length > 0) {
  console.log("Found client-side hooks in server components:")
  issues.forEach((issue) => {
    console.log(`${issue.file}: ${issue.hooks.join(", ")}`)
  })
  process.exit(1)
} else {
  console.log("No client-side hooks found in server components.")
  process.exit(0)
}
