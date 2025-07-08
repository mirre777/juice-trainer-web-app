# Program Sending System

This document describes the program sending functionality that allows trainers to convert and send workout programs from the web app to clients' mobile apps.

## Overview

The program sending system enables trainers to:
- Convert imported Google Sheets programs into mobile-compatible format
- Send programs directly to clients' mobile apps
- Handle both periodized and non-periodized program structures
- Automatically create exercises in clients' collections
- Maintain proper data relationships between trainer and client accounts

## Architecture

### Data Flow
1. **Program Import**: Trainer imports program via Google Sheets
2. **Program Review**: Trainer reviews and edits program structure
3. **Client Selection**: Trainer selects target client from their client list
4. **Data Conversion**: Program data is converted to mobile app format
5. **Exercise Management**: Exercises are created/linked in client's collection
6. **Program Creation**: Complete program is created in client's mobile app
7. **Notification**: Client receives program in their mobile app

### Mobile App Data Structure

The mobile app uses a specific data structure that differs from the web app:

#### MobileProgram
\`\`\`typescript
interface MobileProgram {
  id: string
  name: string
  notes: string
  startedAt: Firestore.Timestamp
  duration: number
  createdAt: Firestore.Timestamp
  updatedAt: Firestore.Timestamp
  program_URL: string
  routines: Array<{
    routineId: string
    week: number
    order: number
  }>
}
\`\`\`

#### MobileRoutine
\`\`\`typescript
interface MobileRoutine {
  id: string
  name: string
  notes: string
  createdAt: Firestore.Timestamp
  updatedAt: Firestore.Timestamp
  deletedAt: null
  type: "program"
  programId: string
  exercises: Array<{
    id: string
    name: string
    sets: Array<{
      id: string
      type: string
      weight: string
      reps: string
      notes?: string
    }>
  }>
}
\`\`\`

#### MobileExercise
\`\`\`typescript
interface MobileExercise {
  id: string
  name: string
  muscleGroup: string
  isCardio: boolean
  isFullBody: boolean
  isMobility: boolean
  createdAt: Firestore.Timestamp
  updatedAt: Firestore.Timestamp
  deletedAt: null
}
\`\`\`

## Implementation

### Core Service: ProgramConversionService

**Location**: `lib/firebase/program-conversion-service.ts`

The `ProgramConversionService` handles the complete conversion and sending process:

#### Key Methods

##### `sendProgramToClient(clientId, programData, customMessage?)`
Main entry point for sending programs to clients.

\`\`\`typescript
async sendProgramToClient(clientId: string, programData: any, customMessage?: string): Promise<any>
\`\`\`

**Process:**
1. Resolves client's user ID from trainer's client document
2. Validates client has linked mobile app account
3. Calls `convertAndSendProgram()` to perform conversion
4. Returns success confirmation with program ID

##### `convertAndSendProgram(programData, clientUserId)`
Converts web app program format to mobile app format.

\`\`\`typescript
async convertAndSendProgram(programData: any, clientUserId: string): Promise<string>
\`\`\`

**Process:**
1. Creates batch write operation for performance
2. Handles both periodized and non-periodized programs
3. Creates routine documents for each week/routine combination
4. Creates program document with routine references
5. Commits entire batch atomically

##### `ensureExerciseExists(userId, exerciseName)`
Ensures exercises exist in client's exercise collection.

\`\`\`typescript
private async ensureExerciseExists(userId: string, exerciseName: string): Promise<string>
\`\`\`

**Process:**
1. Checks global exercises collection first
2. Checks user's custom exercises collection
3. Creates new exercise if not found
4. Returns exercise ID for routine creation

### API Integration

**Endpoint**: `/api/programs/send-to-client`
**Method**: `POST`

**Request Body:**
\`\`\`json
{
  "clientId": "client-document-id",
  "programData": {
    "name": "Program Name",
    "duration_weeks": 4,
    "is_periodized": true,
    "weeks": [...] // or "routines": [...]
  },
  "customMessage": "Optional message for client"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "programId": "generated-program-id",
  "clientUserId": "client-user-id",
  "message": "Program sent successfully"
}
\`\`\`

## Program Structure Handling

### Periodized Programs
Programs with different routines for each week.

**Structure:**
\`\`\`typescript
{
  is_periodized: true,
  weeks: [
    {
      week_number: 1,
      routines: [
        { name: "Week 1 - Push", exercises: [...] },
        { name: "Week 1 - Pull", exercises: [...] }
      ]
    },
    {
      week_number: 2,
      routines: [
        { name: "Week 2 - Push", exercises: [...] },
        { name: "Week 2 - Pull", exercises: [...] }
      ]
    }
  ]
}
\`\`\`

**Conversion:**
- Each week's routines are created as separate mobile routines
- Program references all routines with week and order information
- Routine names include week information for clarity

### Non-Periodized Programs
Programs with same routines repeated each week.

**Structure:**
\`\`\`typescript
{
  is_periodized: false,
  duration_weeks: 4,
  routines: [
    { name: "Push Day", exercises: [...] },
    { name: "Pull Day", exercises: [...] }
  ]
}
\`\`\`

**Conversion:**
- Base routines are duplicated for each week
- Each week gets identical routine structure
- Program duration determines total weeks

## Exercise Management

### Exercise Resolution Strategy
1. **Global Collection**: Check `exercises` collection for standard exercises
2. **User Collection**: Check `users/{userId}/exercises` for custom exercises
3. **Creation**: Create new exercise in user collection if not found

### Exercise Data Mapping
\`\`\`typescript
// Web app exercise format
{
  name: "Bench Press",
  sets: [
    { reps: "10", weight: "135", rpe: "7", rest: "90s", notes: "Focus on form" }
  ]
}

// Mobile app exercise format
{
  id: "exercise-uuid",
  name: "Bench Press",
  sets: [
    {
      id: "set-uuid",
      type: "normal",
      reps: "10",
      weight: "135",
      notes: "RPE: 7 | Rest: 90s | Focus on form"
    }
  ]
}
\`\`\`

## Timestamp Handling

### Critical Issue: Timestamp Serialization

**Problem**: Firestore `serverTimestamp()` values were being serialized by utility functions, causing them to be stored as Map objects instead of proper timestamps.

**Symptoms:**
\`\`\`javascript
// Incorrect storage (Map object)
createdAt: {
  _methodName: "serverTimestamp"
}

// Correct storage (Firestore Timestamp)
createdAt: Timestamp { seconds: 1640995200, nanoseconds: 0 }
\`\`\`

**Root Cause**: The `removeUndefinedValues()` utility function was recursively processing objects and inadvertently serializing `serverTimestamp()` sentinel values.

**Solution**: Modified `removeUndefinedValues()` to detect and preserve `serverTimestamp()` objects:

\`\`\`typescript
private removeUndefinedValues(obj: any): any {
  // CRITICAL FIX: Check if this is a serverTimestamp() sentinel value
  if (obj && typeof obj === "object" && obj._methodName === "serverTimestamp") {
    return obj // Return the serverTimestamp() as-is without processing
  }
  
  // Continue with normal processing for other objects
  // ...
}
\`\`\`

**Best Practices:**
1. Never call `JSON.stringify()` on objects containing `serverTimestamp()`
2. Avoid recursive object processing on timestamp fields
3. Pass `serverTimestamp()` directly to Firestore operations
4. Use batch operations to maintain timestamp consistency

## Client Account Linking

### Requirements
For a client to receive programs, they must have:
1. **Active Status**: `status: "Active"` in trainer's client document
2. **Linked Account**: `hasLinkedAccount: true` in client document
3. **User ID**: Valid `userId` field pointing to mobile app user
4. **User Document**: Existing user document in `users/{userId}` collection

### Validation Process
\`\`\`typescript
// Check client document
const clientDoc = await getDoc(doc(db, "users", trainerId, "clients", clientId))
const clientData = clientDoc.data()

// Validate requirements
const hasUserId = clientData.userId && clientData.userId.trim() !== ""
const isActive = clientData.status === "Active"
const hasLinkedAccount = clientData.hasLinkedAccount === true

// Verify user document exists
const userDoc = await getDoc(doc(db, "users", clientData.userId))
const userExists = userDoc.exists()
\`\`\`

## Error Handling

### Common Error Scenarios

#### 1. Client Not Found
\`\`\`typescript
// Error: Client document doesn't exist
// Solution: Verify clientId and trainer relationship
\`\`\`

#### 2. Client Not Linked
\`\`\`typescript
// Error: "Client not found or client does not have a linked user account"
// Solution: Client needs to link their mobile app account
\`\`\`

#### 3. Invalid Program Structure
\`\`\`typescript
// Error: Program has no valid weeks or routines structure
// Solution: Validate program data before sending
\`\`\`

#### 4. Exercise Creation Failure
\`\`\`typescript
// Error: Failed to create exercise in user collection
// Solution: Check user permissions and collection access
\`\`\`

#### 5. Batch Write Timeout
\`\`\`typescript
// Error: Batch operation timeout
// Solution: Reduce batch size or implement retry logic
\`\`\`

### Error Recovery Strategies

1. **Retry Logic**: Implement exponential backoff for transient failures
2. **Partial Success**: Track which routines were created successfully
3. **Cleanup**: Remove partially created data on failure
4. **Validation**: Pre-validate all data before starting conversion
5. **Logging**: Comprehensive logging for debugging

## Performance Considerations

### Batch Operations
- Use Firestore batch writes for atomic operations
- Limit batch size to avoid timeout (recommended: 10-20 operations)
- Process large programs in chunks

### Concurrency Control
- Limit concurrent exercise creation operations
- Use Promise.all() with chunking for parallel processing
- Implement rate limiting for API calls

### Memory Management
- Avoid loading entire program data into memory
- Stream large datasets when possible
- Clean up temporary objects after processing

## Testing

### Unit Tests
\`\`\`typescript
// Test exercise resolution
describe('ensureExerciseExists', () => {
  it('should find existing global exercise', async () => {
    // Test global exercise lookup
  })
  
  it('should create new exercise if not found', async () => {
    // Test exercise creation
  })
})

// Test program conversion
describe('convertAndSendProgram', () => {
  it('should handle periodized programs', async () => {
    // Test periodized program conversion
  })
  
  it('should handle non-periodized programs', async () => {
    // Test non-periodized program conversion
  })
})
\`\`\`

### Integration Tests
\`\`\`typescript
// Test complete flow
describe('Program Sending Flow', () => {
  it('should send program from import to mobile app', async () => {
    // Test end-to-end program sending
  })
})
\`\`\`

## Monitoring and Analytics

### Key Metrics
- Program send success rate
- Average conversion time
- Exercise creation frequency
- Client engagement with sent programs

### Logging Strategy
\`\`\`typescript
// Structured logging for debugging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  event: 'program_sent',
  trainerId,
  clientId,
  programId,
  routineCount,
  exerciseCount,
  processingTime
}))
\`\`\`

## Security Considerations

### Data Access Control
- Trainers can only send programs to their own clients
- Client user IDs are validated before program creation
- All operations require proper authentication

### Data Validation
- Validate program structure before conversion
- Sanitize exercise names and descriptions
- Prevent injection attacks in custom messages

### Privacy Protection
- No sensitive trainer data is stored in client programs
- Client data is isolated per user account
- Audit trail for all program sending operations

## Future Enhancements

### Planned Features
1. **Program Templates**: Reusable program templates for common scenarios
2. **Bulk Sending**: Send programs to multiple clients simultaneously
3. **Program Versioning**: Track program updates and changes
4. **Client Feedback**: Collect feedback on sent programs
5. **Progress Tracking**: Monitor client progress on sent programs
6. **Custom Exercises**: Allow trainers to create custom exercises
7. **Program Scheduling**: Schedule program delivery for future dates
8. **Notification System**: Enhanced notifications for program delivery

### Technical Improvements
1. **Caching**: Cache frequently used exercises and program templates
2. **Compression**: Compress large program data for faster transfer
3. **Offline Support**: Support offline program creation and queuing
4. **Real-time Updates**: Real-time status updates during conversion
5. **Error Recovery**: Automatic retry and recovery mechanisms
6. **Performance Optimization**: Further optimize batch operations
7. **Data Migration**: Tools for migrating existing programs
8. **API Versioning**: Support multiple API versions for compatibility

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Programs not appearing in mobile app
**Symptoms**: Program sent successfully but not visible in client's app
**Diagnosis**: 
1. Check client account linking status
2. Verify user document exists
3. Check mobile app sync status
**Solution**: Ensure proper account linking and force app refresh

#### Issue: Timestamp serialization errors
**Symptoms**: `createdAt` fields showing as Map objects
**Diagnosis**: Check for JSON serialization of serverTimestamp()
**Solution**: Use fixed `removeUndefinedValues()` function

#### Issue: Exercise creation failures
**Symptoms**: Routines created but exercises missing
**Diagnosis**: Check exercise name validation and permissions
**Solution**: Validate exercise names and ensure proper collection access

#### Issue: Batch operation timeouts
**Symptoms**: Large programs failing to send
**Diagnosis**: Check program size and batch operation limits
**Solution**: Implement chunking and retry logic

### Debug Tools

#### Console Logging
Enable detailed logging by setting debug flags:
\`\`\`typescript
const DEBUG_PROGRAM_SENDING = true
\`\`\`

#### Firestore Console
Monitor operations in Firestore console:
1. Check document creation timestamps
2. Verify data structure matches expected format
3. Monitor batch operation success/failure

#### API Testing
Test API endpoints directly:
\`\`\`bash
curl -X POST /api/programs/send-to-client \
  -H "Content-Type: application/json" \
  -d '{"clientId": "test-id", "programData": {...}}'
\`\`\`

## Support and Maintenance

### Regular Maintenance Tasks
1. Monitor error rates and performance metrics
2. Clean up failed program creation attempts
3. Update exercise database with new exercises
4. Review and optimize batch operation sizes
5. Update documentation with new features

### Support Escalation
1. **Level 1**: Check common issues and solutions
2. **Level 2**: Review logs and error messages
3. **Level 3**: Debug code and database state
4. **Level 4**: Escalate to development team

For technical support, provide:
- Trainer ID and client ID
- Program data structure
- Error messages and timestamps
- Steps to reproduce the issue
