# Google Sheets Import - Technical Implementation

This document provides technical details for developers working on the Google Sheets import system.

## Architecture Overview

The import system follows a multi-stage pipeline:

1. **Client Submission**: User submits Google Sheets URL and program name.
2. **Firestore Storage**: Import record created with metadata.
3. **AI Processing**: Background service processes sheet data.
4. **Human Review**: Quality assurance step. Your structured workout program will be ready for review within 24 hours, transitioning to a "reviewed" status.
5. **Completion Notification**: Real-time update to client.
6. **Program Creation**: Structured program available for use.

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
// Client-side import creation in ImportProgramsClient.tsx
const handleSubmit = async () => {
  if (!isValidGoogleSheetsUrl(googleSheetsLink)) {
    toast.error("Please enter a valid Google Sheets URL")
    return
  }

  if (!programNameInput.trim()) {
    toast.error("Please enter a program name")
    return
  }

  setIsProcessing(true)

  try {
    const docRef = await addDoc(collection(db, "sheets_imports"), {
      createdAt: serverTimestamp(),
      sheetsUrl: googleSheetsLink,
      spreadsheetId: extractSpreadsheetId(googleSheetsLink),
      status: "ready_for_conversion",
      updatedAt: serverTimestamp(),
      userId: userId,
      name: programNameInput.trim(), // Program name is now saved
    })

    toast.success("Import started! You'll be notified when it's ready for review.")
    
    // Reset form
    setGoogleSheetsLink("")
    setProgramNameInput("")
    setIsModalOpen(false)
  } catch (error) {
    console.error("Error creating import:", error)
    toast.error("Failed to start import. Please try again.")
  } finally {
    setIsProcessing(false)
  }
}
\`\`\`

### 2. Real-time Monitoring

\`\`\`typescript
// Firestore listener for status changes in ImportProgramsClient.tsx
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

      // Detect newly completed imports for notifications
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
// API route for processing sheets data in app/api/programs/import-sheet/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sheetId = searchParams.get("sheetId")

    if (!sheetId) {
      return NextResponse.json(
        { message: "Sheet ID is required" }, 
        { status: 400 }
      )
    }

    // Get user's Google token
    const token = await getTokenFromServer()
    if (!token) {
      return NextResponse.json(
        { message: "Google authentication required" }, 
        { status: 401 }
      )
    }
    
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
    
  } catch (error: any) {
    console.error("Google Sheets import error:", error)
    
    if (error.code === 403) {
      return NextResponse.json(
        { message: "Sheet is private. Please share with 'Anyone with link can view'" }, 
        { status: 403 }
      )
    }
    
    if (error.code === 404) {
      return NextResponse.json(
        { message: "Sheet not found. Please check the URL." }, 
        { status: 404 }
      )
    }
    
    if (error.code === 429) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again later." }, 
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { message: "Failed to import from Google Sheets" }, 
      { status: 500 }
    )
  }
}
\`\`\`

## State Management

### Component State

\`\`\`typescript
// State interface for ImportProgramsClient.tsx
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

// State management in component
const [userId, setUserId] = useState<string | null>(null)
const [isCheckingAuth, setIsCheckingAuth] = useState(true)
const [googleSheetsLink, setGoogleSheetsLink] = useState("")
const [programNameInput, setProgramNameInput] = useState("")
const [isProcessing, setIsProcessing] = useState(false)
const [isModalOpen, setIsModalOpen] = useState(false)
const [imports, setImports] = useState<SheetsImport[]>([])
const [isLoadingImports, setIsLoadingImports] = useState(true)
const [searchTerm, setSearchTerm] = useState("")
const [completedImports, setCompletedImports] = useState<SheetsImport[]>([])
const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())
\`\`\`

### Notification Management

\`\`\`typescript
// Notification handling in ImportProgramsClient.tsx
const dismissNotification = (importId: string) => {
  setDismissedNotifications(prev => new Set([...prev, importId]))
  setCompletedImports(prev => prev.filter(imp => imp.id !== importId))
}

// Load dismissed notifications from localStorage
useEffect(() => {
  const dismissed = localStorage.getItem('dismissedImportNotifications')
  if (dismissed) {
    try {
      const dismissedArray = JSON.parse(dismissed)
      setDismissedNotifications(new Set(dismissedArray))
    } catch (error) {
      console.error('Error loading dismissed notifications:', error)
    }
  }
}, [])

// Save dismissed notifications to localStorage
useEffect(() => {
  localStorage.setItem(
    'dismissedImportNotifications', 
    JSON.stringify([...dismissedNotifications])
  )
}, [dismissedNotifications])
\`\`\`

## Error Handling

### Client-side Validation

\`\`\`typescript
// URL validation functions
const isValidGoogleSheetsUrl = (url: string): boolean => {
  return url.includes("docs.google.com/spreadsheets") && 
         extractSpreadsheetId(url) !== null
}

const extractSpreadsheetId = (url: string): string | null => {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Form validation in submit handler
const handleSubmit = async () => {
  if (!isValidGoogleSheetsUrl(googleSheetsLink)) {
    toast.error("Please enter a valid Google Sheets URL")
    return
  }

  if (!programNameInput.trim()) {
    toast.error("Please enter a program name")
    return
  }

  // Continue with submission...
}
\`\`\`

### API Error Handling

\`\`\`typescript
// Comprehensive error handling in API routes
export async function GET(request: Request) {
  try {
    // ... API logic
  } catch (error: any) {
    console.error("Google Sheets import error:", error)
    
    // Handle specific Google API errors
    if (error.code === 403) {
      return NextResponse.json(
        { message: "Sheet is private. Please share with 'Anyone with link can view'" }, 
        { status: 403 }
      )
    }
    
    if (error.code === 404) {
      return NextResponse.json(
        { message: "Sheet not found. Please check the URL." }, 
        { status: 404 }
      )
    }
    
    if (error.code === 429) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again later." }, 
        { status: 429 }
      )
    }
    
    // Generic error response
    return NextResponse.json(
      { message: "Failed to import from Google Sheets" }, 
      { status: 500 }
    )
  }
}
\`\`\`

### Error Recovery Patterns

\`\`\`typescript
// Retry mechanism with exponential backoff
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = Math.pow(2, i) * 1000 // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Usage in API calls
const fetchSheetData = async (sheetId: string) => {
  return retryWithBackoff(async () => {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: true,
    })
    return response.data
  })
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

// Required Firestore index
// Collection: sheets_imports
// Fields: userId (Ascending), createdAt (Descending)
\`\`\`

### Component Optimization

\`\`\`typescript
// Memoized filtering for search
const filteredImports = useMemo(() => 
  imports.filter(importItem =>
    importItem.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.programName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.spreadsheetId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ), [imports, debouncedSearchTerm]
)

// Debounced search input
const debouncedSearchTerm = useDebounce(searchTerm, 300)

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
\`\`\`

### Memory Management

\`\`\`typescript
// Proper cleanup of listeners
useEffect(() => {
  if (!userId) return

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    // Handle snapshot
  })

  // Cleanup function
  return () => {
    unsubscribe()
  }
}, [userId])

// Cleanup on component unmount
useEffect(() => {
  return () => {
    // Clear any pending timeouts
    // Cancel any ongoing requests
    // Clean up event listeners
  }
}, [])
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
      
      // Allow creation if user is authenticated and owns the document
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
      
      // Prevent unauthorized updates
      allow update: if request.auth != null && 
                      request.auth.uid == resource.data.userId &&
                      request.resource.data.userId == resource.data.userId;
    }
  }
}
\`\`\`

### Token Security

\`\`\`typescript
// Secure token handling in lib/auth/token-service.ts
export async function getTokenFromServer(): Promise<OAuth2Client | null> {
  try {
    // Get encrypted token from secure storage
    const encryptedToken = await getEncryptedToken()
    
    if (!encryptedToken) {
      console.warn('No encrypted token found')
      return null
    }
    
    // Decrypt and validate token
    const tokenData = decrypt(encryptedToken)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials(tokenData)
    
    // Check if token needs refresh
    if (isTokenExpired(tokenData)) {
      console.log('Token expired, refreshing...')
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      
      // Store refreshed token
      await storeEncryptedToken(encrypt(credentials))
    }
    
    return oauth2Client
  } catch (error) {
    console.error("Token retrieval error:", error)
    return null
  }
}

// Token expiration check
function isTokenExpired(tokenData: any): boolean {
  if (!tokenData.expiry_date) return true
  return Date.now() >= tokenData.expiry_date
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

  it('should handle URLs with additional parameters', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
    const id = extractSpreadsheetId(url)
    expect(id).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
  })
})

// Test form validation
describe('Import Form Validation', () => {
  it('should reject invalid URLs', () => {
    expect(isValidGoogleSheetsUrl('https://example.com')).toBe(false)
    expect(isValidGoogleSheetsUrl('not-a-url')).toBe(false)
  })

  it('should accept valid Google Sheets URLs', () => {
    const validUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
    expect(isValidGoogleSheetsUrl(validUrl)).toBe(true)
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
      userId: mockUser.uid,
      name: 'Test Program'
    }
    
    // Verify Firestore document creation
    const docRef = await addDoc(collection(db, 'sheets_imports'), importData)
    expect(docRef.id).toBeDefined()
    
    // Verify real-time updates work
    const unsubscribe = onSnapshot(doc(db, 'sheets_imports', docRef.id), (doc) => {
      expect(doc.data()).toMatchObject(importData)
    })
    
    // Cleanup
    unsubscribe()
  })
})

// Test API endpoints
describe('Import Sheet API', () => {
  it('should return 400 for missing sheet ID', async () => {
    const response = await fetch('/api/programs/import-sheet')
    expect(response.status).toBe(400)
  })

  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/programs/import-sheet?sheetId=test')
    expect(response.status).toBe(401)
  })
})
\`\`\`

### End-to-End Tests

\`\`\`typescript
// E2E test for complete import flow
describe('Google Sheets Import E2E', () => {
  it('should complete full import workflow', async () => {
    // 1. Navigate to import page
    await page.goto('/import-programs')
    
    // 2. Fill in form
    await page.fill('[data-testid="sheets-url-input"]', 'https://docs.google.com/spreadsheets/d/test-id')
    await page.fill('[data-testid="program-name-input"]', 'Test Program')
    
    // 3. Submit form
    await page.click('[data-testid="submit-import"]')
    
    // 4. Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    
    // 5. Verify import appears in history
    await expect(page.locator('[data-testid="import-history"]')).toContainText('Test Program')
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
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
\`\`\`

### Firestore Indexes

\`\`\`json
// Required Firestore indexes for optimal query performance
{
  "indexes": [
    {
      "collectionGroup": "sheets_imports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sheets_imports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
\`\`\`

### API Rate Limits

\`\`\`typescript
// Google Sheets API rate limiting configuration
const RATE_LIMIT = {
  requests_per_minute: 100,
  requests_per_day: 50000,
  concurrent_requests: 10
}

// Implement rate limiting middleware
export async function rateLimitMiddleware(request: Request) {
  const userId = await getUserIdFromRequest(request)
  const key = `sheets_api_${userId}`
  
  const current = await redis.get(key)
  if (current && parseInt(current) >= RATE_LIMIT.requests_per_minute) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  
  await redis.incr(key)
  await redis.expire(key, 60) // 1 minute window
  
  return null // Continue processing
}

// Implement exponential backoff for API calls
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error.code === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000
        console.log(`Rate limited, retrying in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
\`\`\`

### Monitoring + Debugging

### Logging Strategy

\`\`\`typescript
// Structured logging for debugging
interface ImportLogEvent {
  timestamp: string
  event: string
  userId: string
  importId?: string
  spreadsheetId?: string
  status?: string
  error?: string
  duration?: number
  metadata?: Record<string, any>
}

const logImportEvent = (event: string, data: Partial<ImportLogEvent>) => {
  const logEntry: ImportLogEvent = {
    timestamp: new Date().toISOString(),
    event,
    userId: data.userId || 'unknown',
    ...data
  }
  
  console.log(JSON.stringify(logEntry))
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoring(logEntry)
  }
}

// Usage throughout the import flow
logImportEvent('import_started', { 
  userId, 
  spreadsheetId, 
  sheetsUrl,
  programName: programNameInput 
})

logImportEvent('import_completed', { 
  userId, 
  importId: docRef.id,
  spreadsheetId, 
  duration: Date.now() - startTime 
})

logImportEvent('import_failed', { 
  userId, 
  importId,
  spreadsheetId, 
  error: error.message,
  stack: error.stack 
})
\`\`\`

### Performance Monitoring

\`\`\`typescript
// Track import processing times and success rates
class ImportMetrics {
  private static metrics = new Map<string, number[]>()
  
  static recordProcessingTime(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    this.metrics.get(operation)!.push(duration)
  }
  
  static getAverageProcessingTime(operation: string): number {
    const times = this.metrics.get(operation) || []
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }
  
  static getSuccessRate(operation: string): number {
    // Implementation for tracking success/failure rates
    return 0.95 // Example: 95% success rate
  }
}

// Usage in API routes
const startTime = performance.now()

try {
  const program = await convertSheetDataToProgram(sheetData)
  const processingTime = performance.now() - startTime
  
  ImportMetrics.recordProcessingTime('sheet_conversion', processingTime)
  logImportEvent('conversion_success', { 
    duration: processingTime,
    programName: program.program_title 
  })
  
} catch (error) {
  const failureTime = performance.now() - startTime
  ImportMetrics.recordProcessingTime('sheet_conversion_failed', failureTime)
  logImportEvent('conversion_failed', { 
    duration: failureTime,
    error: error.message 
  })
}
\`\`\`

### Health Checks

\`\`\`typescript
// Health check endpoint for monitoring
export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      firestore: 'unknown',
      google_sheets_api: 'unknown',
      authentication: 'unknown'
    },
    metrics: {
      active_imports: 0,
      processing_queue_size: 0,
      average_processing_time: 0
    }
  }
  
  try {
    // Check Firestore connectivity
    await db.collection('health_check').doc('test').get()
    healthCheck.services.firestore = 'healthy'
  } catch (error) {
    healthCheck.services.firestore = 'unhealthy'
    healthCheck.status = 'degraded'
  }
  
  try {
    // Check Google Sheets API
    const token = await getTokenFromServer()
    if (token) {
      healthCheck.services.google_sheets_api = 'healthy'
    } else {
      healthCheck.services.google_sheets_api = 'no_token'
    }
  } catch (error) {
    healthCheck.services.google_sheets_api = 'unhealthy'
    healthCheck.status = 'degraded'
  }
  
  // Get current metrics
  healthCheck.metrics.average_processing_time = 
    ImportMetrics.getAverageProcessingTime('sheet_conversion')
  
  return NextResponse.json(healthCheck)
}
\`\`\`

This comprehensive technical implementation guide provides developers with all the necessary details to understand, maintain, and extend the Google Sheets import system in the Juice Coaching Platform.
