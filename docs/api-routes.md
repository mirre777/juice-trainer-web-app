# API Routes Documentation

This document outlines the API routes available in the Juice Coaching Platform.

## Authentication Routes

### User Authentication

- `POST /api/auth/login` - Authenticates a user with email and password
  - Request: `{ email: string, password: string }`
  - Response: `{ success: boolean, user: User, token: string }`
  - Implementation: `app/api/auth/login/route.ts`

- `POST /api/auth/signup` - Registers a new user
  - Request: `{ name: string, email: string, password: string, role: string }`
  - Response: `{ success: boolean, user: User, token: string }`
  - Implementation: `app/api/auth/signup/route.ts`

- `POST /api/auth/logout` - Logs out the current user
  - Response: `{ success: boolean }`
  - Implementation: `app/api/auth/logout/route.ts`

- `GET /api/auth/me` - Gets the current authenticated user
  - Response: `{ user: User }`
  - Implementation: `app/api/auth/me/route.ts`

### Google OAuth

- `GET /api/auth/google/callback` - Handles the OAuth callback from Google
  - Query: `{ code: string, state: string }`
  - Response: Redirects to the application with authentication token
  - Implementation: `app/api/auth/google/callback/route.ts`

- `POST /api/auth/google/refresh` - Refreshes the Google OAuth token
  - Request: `{ refreshToken: string }`
  - Response: `{ accessToken: string, expiresAt: number }`
  - Implementation: `app/api/auth/google/refresh/route.ts`

- `POST /api/auth/google/logout` - Revokes Google OAuth tokens
  - Request: `{ token: string }`
  - Response: `{ success: boolean }`
  - Implementation: `app/api/auth/google/logout/route.ts`

### Google Sheets Integration

- `GET /api/auth/google/sheets-auth` - Initiates Google Sheets authentication
  - Response: Redirects to Google OAuth consent screen
  - Implementation: `app/api/auth/google/sheets-auth/route.ts`

- `GET /api/auth/google/sheets-callback` - Handles the OAuth callback for Google Sheets
  - Query: `{ code: string, state: string }`
  - Response: Redirects to the application with authentication token
  - Implementation: `app/api/auth/google/sheets-callback/route.ts`

## Client Management

### Invitations

- `GET /api/invitations/[code]` - Gets details about an invitation
  - Path: `code` - The invitation code
  - Response: `{ invitation: Invitation, client: Client }`
  - Implementation: `app/api/invitations/[code]/route.ts`

- `POST /api/invitations/[code]/validate` - Validates an invitation code
  - Path: `code` - The invitation code
  - Response: `{ valid: boolean, invitation: Invitation }`
  - Implementation: `app/api/invitations/[code]/validate/route.ts`

## Program Management

- `POST /api/programs/import-sheet` - Imports a workout program from Google Sheets
  - Request: `{ sheetId: string, sheetName: string }`
  - Response: `{ success: boolean, program: Program }`
  - Implementation: `app/api/programs/import-sheet/route.ts`

## Payment Processing

- `POST /api/payments/create-intent` - Creates a payment intent for Stripe
  - Request: `{ amount: number, currency: string, description: string }`
  - Response: `{ clientSecret: string }`
  - Implementation: `app/api/payments/create-intent/route.ts`

- `POST /api/stripe-webhook` - Handles Stripe webhook events
  - Request: Stripe event payload
  - Response: `{ received: boolean }`
  - Implementation: `app/api/stripe-webhook/route.ts`

## API Implementation Details

### Authentication Middleware

API routes use middleware to authenticate requests:

\`\`\`typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/token-service'

export async function middleware(request: NextRequest) {
  // Check if the route requires authentication
  if (request.nextUrl.pathname.startsWith('/api/protected')) {
    // Get the token from the request
    const token = request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      // Verify the token
      const decoded = await verifyToken(token)
      
      // Add the user to the request
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decoded.userId)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  return NextResponse.next()
}
\`\`\`

### Error Handling

API routes implement consistent error handling:

\`\`\`typescript
// Example error handling in an API route
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate the request
    if (!body.email || !body.password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Process the request
    const result = await processRequest(body)
    
    // Return the response
    return Response.json(result)
  } catch (error) {
    console.error('Error processing request:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
\`\`\`

### Demo Mode

API routes handle demo mode by checking for a demo flag or user ID:

\`\`\`typescript
// Example API route with demo mode support
export async function GET(request: Request) {
  // Check if the request is for demo mode
  const url = new URL(request.url)
  const isDemo = url.searchParams.get('demo') === 'true'
  
  if (isDemo) {
    // Return mock data for demo mode
    return Response.json({ data: mockData })
  }
  
  // Process the request normally
  try {
    const data = await fetchRealData()
    return Response.json({ data })
  } catch (error) {
    console.error('Error fetching data:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
\`\`\`

## Best Practices

1. **Consistent Response Format** - All API routes should return responses in a consistent format
2. **Proper Error Handling** - All API routes should handle errors gracefully
3. **Input Validation** - All API routes should validate input data
4. **Authentication** - Protected routes should verify authentication
5. **Demo Mode Support** - API routes should support demo mode where appropriate
6. **Logging** - API routes should log errors and important events
7. **Rate Limiting** - API routes should implement rate limiting to prevent abuse
