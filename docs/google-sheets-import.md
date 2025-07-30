# Google Sheets Import System

This document describes the Google Sheets import functionality that allows trainers to convert their workout programs from Google Sheets into structured programs in the Juice app.

## Overview

The Google Sheets import system enables trainers to:
- Import workout programs directly from Google Sheets
- Convert spreadsheet data into structured workout programs
- Review and edit imported programs before sending to clients
- Track import status and history
- Manage multiple imports simultaneously

## Features

### Core Functionality
- **URL-based Import**: Trainers paste Google Sheets URLs to import programs
- **Real-time Status Updates**: Live updates on import processing status
- **AI + Human Review**: Combines AI processing with human quality assurance
- **Import History**: Track all previous imports with searchable history
- **Status Notifications**: Visual notifications when imports are ready for review

### Import Statuses
- `ready_for_conversion`: Import queued for processing
- `processing`: Currently being converted by AI
- `conversion_complete`: Ready for trainer review
- `completed`: Fully processed and available in programs
- `failed`: Import failed and needs attention

## User Flow

### 1. Import Initiation
1. Trainer navigates to `/import-programs`
2. Trainer pastes Google Sheets URL into input field
3. System validates URL format and extracts spreadsheet ID
4. Import record created in Firestore with `ready_for_conversion` status

### 2. Processing Pipeline
1. AI system processes the Google Sheets data
2. Status updates to `processing`
3. Human reviewer validates AI conversion
4. Status updates to `conversion_complete`
5. Trainer receives notification that program is ready

### 3. Review and Completion
1. Trainer clicks "Review Program" from notification
2. Trainer reviews converted program structure
3. Trainer makes any necessary edits
4. Program is saved and status updates to `completed`

## Database Structure

### Firestore Collection: `sheets_imports`

\`\`\`javascript
{
  id: "auto-generated-id",
  createdAt: Firestore.Timestamp,
  updatedAt: Firestore.Timestamp,
  userId: "trainer-user-id",
  sheetsUrl: "https://docs.google.com/spreadsheets/d/...",
  spreadsheetId: "extracted-spreadsheet-id",
  status: "ready_for_conversion" | "processing" | "conversion_complete" | "completed" | "failed",
  name: "Program name from input", // Now properly saved
  description: "Optional description",
  programName: "Extracted from sheet", // Legacy field
  errorMessage: "Error details if failed"
}
\`\`\`

## API Routes

### Import Creation
**Method**: Client-side via Firestore SDK
**Implementation**: `addDoc()` to `sheets_imports` collection

\`\`\`typescript
// Import creation in ImportProgramsClient.tsx
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

### Import Status Monitoring
**Method**: Real-time Firestore listener via `onSnapshot()`
**Query**: `where("userId", "==", userId)` ordered by `createdAt desc`

\`\`\`typescript
// Real-time listener in ImportProgramsClient.tsx
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

### Google Sheets Data Processing
**Endpoint**: `/api/programs/import-sheet`
**Method**: `GET`
**Parameters**: `?sheetId=spreadsheet-id`

\`\`\`typescript
// Response format from API
{
  program_title: string,
  program_notes: string,
  program_weeks: number,
  routine_count: number,
  routines: WorkoutRoutine[]
}
\`\`\`

## Components

### `ImportProgramsClient`
**Location**: `app/import-programs/ImportProgramsClient.tsx`
**Purpose**: Main import interface component

**Key Features:**
- Google Sheets URL input and validation
- Program name input (now properly implemented)
- Real-time import status monitoring
- Success notifications for completed imports
- Import history with search functionality
- Processing modal with progress indication

**State Management:**
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

### `GoogleSheetsImport`
**Location**: `components/programs/google-sheets-import.tsx`
**Purpose**: Reusable import component for other pages

**Key Features:**
- Google authentication flow
- Sheet link management
- Import dialog integration

### `SheetsImportDialog`
**Location**: `components/programs/sheets-import-dialog.tsx`
**Purpose**: Modal dialog for import configuration

**Key Features:**
- URL input and validation
- Saved links selection
- Import progress tracking

## Authentication + Permissions

### Google Sheets Access
- Requires Google OAuth authentication
- Uses Google Sheets API v4
- Requires "read" permissions on shared spreadsheets

### User Authentication
- Trainers must be logged in to import programs
- User ID associated with all imports for security
- Import history filtered by authenticated user

## Error Handling

### Common Error Scenarios
1. **Invalid URL Format**: Client-side validation prevents submission
2. **Private Spreadsheet**: API returns 403 error, user prompted to share sheet
3. **Malformed Sheet Data**: AI processing flags for human review
4. **Network Errors**: Retry mechanism with exponential backoff
5. **Authentication Expired**: Automatic token refresh or re-authentication prompt

### Error Recovery
- Failed imports can be retried from the import history
- Error messages stored in Firestore for debugging
- Support team can access error logs for troubleshooting

### Client-side Validation
\`\`\`typescript
// URL validation in ImportProgramsClient.tsx
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

## Real-time Updates

### Status Change Notifications
The system uses Firestore real-time listeners to provide instant updates:

\`\`\`typescript
// Notification system in ImportProgramsClient.tsx
const dismissNotification = (importId: string) => {
  setDismissedNotifications(prev => new Set([...prev, importId]))
  setCompletedImports(prev => prev.filter(imp => imp.id !== importId))
}

// Filter newly completed imports
const newlyCompleted = imports.filter(imp => 
  imp.status === "conversion_complete" && 
  !dismissedNotifications.has(imp.id)
)
\`\`\`

### Notification System
- Green success banner appears when status changes to `conversion_complete`
- Notifications include program name and spreadsheet ID for identification
- Dismissible notifications with persistent state management
- Multiple notifications supported for concurrent imports

## Google Sheets Format Requirements

### Recommended Structure
1. **Overview Sheet**: Program metadata (title, weeks, notes)
2. **Routine Sheets**: One sheet per workout routine
3. **Exercise Data**: Structured columns for exercises, sets, reps, RPE

### Expected Columns
- Exercise Name
- Exercise Category
- Sets
- Reps
- RPE (Rate of Perceived Exertion)
- Rest Periods
- Notes

### Data Validation
- AI validates sheet structure during processing
- Human reviewer ensures exercise names are standardized
- Missing data flagged for trainer attention during review

## Performance Considerations

### Optimization Strategies
- Firestore queries limited to user's imports only
- Real-time listeners automatically unsubscribe on component unmount
- Import history pagination for large datasets
- Debounced search functionality

\`\`\`typescript
// Debounced search implementation
const debouncedSearchTerm = useDebounce(searchTerm, 300)

const filteredImports = useMemo(() => 
  imports.filter(importItem =>
    importItem.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.programName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    importItem.spreadsheetId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ), [imports, debouncedSearchTerm]
)
\`\`\`

### Scalability
- Firestore automatically scales with user growth
- Google Sheets API has rate limits (handled with retry logic)
- Processing queue prevents system overload
- Cached results for frequently imported sheets

## Security

### Data Protection
- All imports associated with authenticated user ID
- Google Sheets URLs validated before processing
- No sensitive data stored in client-side state
- Firestore security rules prevent cross-user access

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

### Privacy
- Import history private to each trainer
- Google Sheets access limited to read-only
- No permanent storage of Google Sheets content
- User can delete import history

## Monitoring + Analytics

### Import Metrics
- Track import success/failure rates
- Monitor processing times
- Identify common error patterns
- Measure user adoption

### Performance Monitoring
- API response times
- Firestore query performance
- Google Sheets API usage
- Error rate tracking

## Future Enhancements

### Planned Features
1. **Bulk Import**: Import multiple sheets simultaneously
2. **Template Library**: Pre-built sheet templates for common programs
3. **Advanced Mapping**: Custom field mapping for non-standard sheets
4. **Import Scheduling**: Schedule imports for specific times
5. **Version Control**: Track changes to imported programs
6. **Collaboration**: Share import templates between trainers
7. **Mobile Import**: Import functionality in mobile app
8. **Excel Support**: Support for Excel file imports
9. **CSV Import**: Direct CSV file upload support
10. **API Integration**: Direct integration with other fitness platforms

### Technical Improvements
1. **Offline Support**: Cache imports for offline review
2. **Progressive Web App**: Enhanced mobile experience
3. **Background Sync**: Sync imports across devices
4. **Advanced Search**: Full-text search across import history
5. **Export Options**: Export programs back to various formats

## Troubleshooting

### Common Issues
1. **"Sheet is private" error**: User needs to share sheet with "Anyone with link can view"
2. **Import stuck in processing**: Contact support for manual review
3. **Invalid URL format**: Ensure URL is from Google Sheets, not Google Drive
4. **Missing program name**: Program name input is now required for better organization

### Support Resources
- In-app help documentation
- Video tutorials for sheet formatting
- Support ticket system for complex issues
- Community forum for best practices
