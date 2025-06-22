# Google Sheets Import - Technical Implementation

This document provides technical details for developers working on the Google Sheets import system.

## Architecture Overview

The import system follows a multi-stage pipeline:

1.  **Client Submission**: User submits Google Sheets URL and program name.
2.  **Firestore Storage**: Import record created with metadata.
3.  **AI Processing**: Background service processes sheet data.
4.  **Human Review**: Quality assurance step. Your structured workout program will be ready for review within 24 hours, transitioning to a "reviewed" status.
5.  **Completion Notification**: Real-time update to client.
6.  **Program Creation**: Structured program available for use.

## Code Structure

### Frontend Components

\`\`\`
app/import-programs/
├── page.tsx                    # Server component wrapper
├── ImportProgramsClient.tsx    # Main client component for the import page
└── loading.tsx                 # Loading state

components/programs/
├── google-sheets-import.tsx    # Reusable import component (not directly used on /import-programs page)
├── sheets-import-dialog.tsx    # Import modal dialog
└── program-preview.tsx         # Preview converted programs

components/google-sheets/
├── auth-button.tsx            # Google authentication
├── black-auth-button.tsx      # Styled auth button
└── sheets-integration.tsx     # Integration utilities
\`\`\`

### Backend Services

\`\`\`
app/api/programs/
└── import-sheet/
    └── route.ts               # Google Sheets processing API

lib/
├── auth/
│   └── token-service.ts       # Google token management
├── crypto.ts                  # Encryption utilities
└── url-utils.ts              # URL parsing utilities

types/
└── workout-program.ts         # TypeScript interfaces
\`\`\`

## Data Flow

### 1. Import Submission

\`\`\`typescript
// Client-side import creation
const docRef = await addDoc(collection(db, "sheets_imports"), {
  createdAt: serverTimestamp(),
  sheetsUrl: googleSheetsLink,
  spreadsheetId: extractSpreadsheetId(googleSheetsLink),
  status: "ready_for_conversion",
  updatedAt: serverTimestamp(),
  userId: userId,
  name: programNameInput.trim(), // Program name is now saved
})
\`\`\`

### 2. Real-time Monitoring

\`\`\`typescript
// Firestore listener for status changes
useEffect(() => {
  if (!userId) return

  const q = query(
    collection(db, "sheets_imports"), 
    where("userId", "==", userId), 
    orderBy("createdAt", "desc")
  )

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const importsData: SheetsImport[] = []
    const newlyCompleted: SheetsImport[] = []

    querySnapshot.forEach((doc) => {
      const importData = { id: doc.id, ...doc.data() } as SheetsImport
      importsData.push(importData)

      // Detect newly completed imports
      if (importData.status === "conversion_complete" && 
          !dismissedNotifications.has(importData.id)) {
        newlyCompleted.push(importData)
      }
    })

    setImports(importsData)
    setCompletedImports(newlyCompleted)
  })

  return () => unsubscribe()
}, [userId, dismissedNotifications])
\`\`\`

### 3. Google Sheets Processing

\`\`\`typescript
// API route for processing sheets data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sheetId = searchParams.get("sheetId")

  // Get user's Google token
  const token = await getTokenFromServer()
  
  // Initialize Google Sheets API
  const sheets = google.sheets({ version: "v4", auth: token })

  // Fetch sheet data
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  })

  // Convert to program format
  const program = convertSheetDataToProgram(response.data)
  return NextResponse.json(program)
}
\`\`\`

## State Management

### Component State

\`\`\`typescript
interface ImportState {
  // Authentication
  userId: string | null
  isCheckingAuth: boolean

  // Import form
  googleSheetsLink: string
  programNameInput: string // New: Program name input
  isProcessing: boolean
  isModalOpen: boolean

  // Import history
  imports: SheetsImport[]
  isLoadingImports: boolean
  searchTerm: string

  // Notifications
  completedImports: SheetsImport[]
  dismissedNotifications: Set<string>
}
\`\`\`

### Notification Management

\`\`\`typescript
// Track dismissed notifications in localStorage
const dismissNotification = (importId: string) => {
  setDismissedNotifications(prev => new Set([...prev, importId]))
  setCompletedImports(prev => prev.filter(imp => imp.id !== importId))
}

// Filter out dismissed notifications
const newlyCompleted = imports.filter(imp => 
  imp.status === "conversion_complete" && 
  !dismissedNotifications.has(imp.id)
)
\`\`\`

## Error Handling

### Client-side Validation

\`\`\`typescript
// URL validation
const isValidGoogleSheetsUrl = (url: string): boolean => {
  return url.includes("docs.google.com/spreadsheets") && 
         extractSpreadsheetId(url) !== null
}

// Spreadsheet ID extraction
const extractSpreadsheetId = (url: string): string | null => {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}
\`\`\`

### API Error Handling

\`\`\`typescript
// Comprehensive error handling in API routes
try {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  })
  
  const program = convertSheetDataToProgram(response.data)
  return NextResponse.json(program)
  
} catch (error: any) { // Explicitly type error as 'any' or 'unknown'
  console.error("Google Sheets import error:", error)
  
  if (error.code === 403) {
    return NextResponse.json(
      { message: "Sheet is private. Please share with 'Anyone with link can view'" }, 
      { status: 403 }
    )
  }
  
  return NextResponse.json(
    { message: "Failed to import from Google Sheets" }, 
    { status: 500 }
  )
}
\`\`\`

## Performance Optimizations

### Firestore Query Optimization

\`\`\`typescript
// Efficient querying with proper indexing
const q = query(
  collection(db, "sheets_imports"),
  where("userId", "==", userId),        // Filter by user first
  orderBy("createdAt", "desc"),         // Then order by date
  limit(50)                             // Limit results for pagination
)
\`\`\`

### Component Optimization

\`\`\`typescript
// Memoized filtering for search
const filteredImports = useMemo(() => 
  imports.filter(importItem =>
    importItem.programName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.spreadsheetId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ), [imports, debouncedSearchTerm]
)

// Debounced search input
const debouncedSearchTerm = useDebounce(searchTerm, 300)
\`\`\`

## Security Implementation

### Firestore Security Rules

\`\`\`javascript
// Security rules for sheets_imports collection
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sheets_imports/{importId} {
      // Users can only access their own imports
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      
      // Allow creation if user is authenticated
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
    }
  }
}
\`\`\`

### Token Security

\`\`\`typescript
// Secure token handling
export async function getTokenFromServer(): Promise<OAuth2Client | null> {
  try {
    // Get encrypted token from secure storage
    const encryptedToken = await getEncryptedToken()
    
    if (!encryptedToken) return null
    
    // Decrypt and validate token
    const tokenData = decrypt(encryptedToken)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials(tokenData)
    
    // Refresh if needed
    if (isTokenExpired(tokenData)) {
      await oauth2Client.refreshAccessToken()
    }
    
    return oauth2Client
  } catch (error) {
    console.error("Token retrieval error:", error)
    return null
  }
}
\`\`\`

## Testing Strategy

### Unit Tests

\`\`\`typescript
// Test URL validation
describe('extractSpreadsheetId', () => {
  it('should extract ID from valid Google Sheets URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
    const id = extractSpreadsheetId(url)
    expect(id).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
  })

  it('should return null for invalid URLs', () => {
    const url = 'https://example.com/not-a-sheet'
    const id = extractSpreadsheetId(url)
    expect(id).toBeNull()
  })
})
\`\`\`

### Integration Tests

\`\`\`typescript
// Test import flow
describe('Import Flow', () => {
  it('should create import record and update status', async () => {
    // Mock user authentication
    const mockUser = { uid: 'test-user-id' }
    
    // Submit import
    const importData = {
      sheetsUrl: 'https://docs.google.com/spreadsheets/d/test-id',
      spreadsheetId: 'test-id',
      status: 'ready_for_conversion',
      userId: mockUser.uid
    }
    
    // Verify Firestore document creation
    const docRef = await addDoc(collection(db, 'sheets_imports'), importData)
    expect(docRef.id).toBeDefined()
    
    // Verify real-time updates
    // ... test listener functionality
  })
})
\`\`\`

## Deployment Considerations

### Environment Variables

\`\`\`bash
# Required environment variables
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ENCRYPTION_KEY=your_encryption_key_for_tokens
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
\`\`\`

### Firestore Indexes

\`\`\`json
// Required Firestore indexes
{
  "indexes": [
    {
      "collectionGroup": "sheets_imports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
\`\`\`

### API Rate Limits

\`\`\`typescript
// Google Sheets API rate limiting
const RATE_LIMIT = {
  requests_per_minute: 100,
  requests_per_day: 50000
}

// Implement exponential backoff
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}
\`\`\`

## Monitoring & Debugging

### Logging Strategy

\`\`\`typescript
// Structured logging for debugging
const logImportEvent = (event: string, data: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    userId: data.userId,
    spreadsheetId: data.spreadsheetId,
    status: data.status,
    ...data
  }))
}

// Usage
logImportEvent('import_started', { userId, spreadsheetId, sheetsUrl })
logImportEvent('import_completed', { userId, spreadsheetId, programId })
logImportEvent('import_failed', { userId, spreadsheetId, error: error.message })
\`\`\`

### Performance Monitoring

\`\`\`typescript
// Track import processing times
const startTime = performance.now()

try {
  const program = await convertSheetDataToProgram(sheetData)
  const processingTime = performance.now() - startTime
  
  // Log performance metrics
  console.log(`Import processed in ${processingTime}ms`)
  
} catch (error) {
  const failureTime = performance.now() - startTime
  console.error(`Import failed after ${failureTime}ms:`, error)
}
\`\`\`

Now, let's apply the necessary code updates:
