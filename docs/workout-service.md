# Workout Service Documentation

## Overview

The workout service provides functionality to fetch and manage workout data from Firebase Firestore. It's designed to work with the client-trainer relationship in the coaching platform.

## Data Structure and Relationships

### Database Structure

\`\`\`
users/
  ├── {trainerId}/ (Trainer's account)
  │   └── clients/
  │       └── {clientId}/ (Client document)
  │           └── userId: "{userId}" (Reference to user account)
  │
  └── {userId}/ (Client's user account)
      └── workouts/
          ├── {workoutId1} (Workout 1)
          └── {workoutId2} (Workout 2)
\`\`\`

### Client ID vs User ID

There are two important IDs to understand:

1. **Trainer ID**: 
   - The Firebase user ID of the logged-in personal trainer
   - Retrieved from the `user_id` cookie
   - Used to access the trainer's clients collection

2. **Client ID** (e.g., `ociLJugd1vRbNwnopV1j`): 
   - This is the document ID in the trainer's clients collection
   - Used in URLs like `/clients/ociLJugd1vRbNwnopV1j`
   - Identifies the client from the trainer's perspective

3. **User ID** (e.g., `xnumhzQK4dRcAqNMHVIfEtnAPZI2`):
   - This is the actual Firebase user ID for the client's account
   - Stored in the client document as the `userId` field
   - Used to fetch the client's workouts from their user account

### Authentication Flow

1. User logs in as a PT
2. Their user ID is stored in a cookie as `user_id`
3. This ID is used as the `trainerId` for all API requests

### Data Flow

When fetching workouts for a client:

1. Start with the client ID from the URL or component props
2. Get the trainer ID from the `user_id` cookie
3. Use these IDs to find the client document in the trainer's clients collection
4. Extract the `userId` field from the client document
5. Use this userId to fetch workouts from the user's workouts collection

## API Routes

### GET /api/clients/[id]/workouts

Fetches all workouts for a specific client.

**Parameters:**
- `id`: The client ID (from the trainer's clients collection)

**Process:**
1. Gets the trainer ID from the `user_id` cookie
2. Gets the client document using the trainer ID and client ID
3. Extracts the userId from the client document
4. Calls `getUserWorkouts(userId)` to fetch the workouts
5. Returns the workouts as JSON

**Response:**
\`\`\`json
{
  "workouts": [
    {
      "id": "7YPntx0W8d0MHYi6sZHA",
      "name": "Monday Workout",
      "date": "2023-05-15",
      "status": "completed",
      ...
    },
    ...
  ]
}
\`\`\`

## Firebase Workout Service

The `lib/firebase/workout-service.ts` file contains functions for interacting with workout data:

### getUserWorkouts(userId)

Fetches all workouts for a specific user.

**Parameters:**
- `userId`: The Firebase user ID (NOT the client ID)

**Returns:**
\`\`\`typescript
{
  workouts: FirebaseWorkout[],
  error: Error | null
}
\`\`\`

### getUserWorkoutById(userId, workoutId)

Fetches a specific workout for a user.

**Parameters:**
- `userId`: The Firebase user ID
- `workoutId`: The workout document ID

**Returns:**
\`\`\`typescript
{
  workout: FirebaseWorkout | null,
  error: Error | null
}
\`\`\`

## Client Components

### ClientWorkouts

The `components/clients/client-workouts.tsx` component displays workouts for a client.

**Props:**
- `clientId`: The client ID from the trainer's clients collection
- `clientName`: The name of the client

**Functionality:**
1. Makes a fetch request to `/api/clients/${clientId}/workouts`
2. Displays loading state while fetching
3. Handles errors if the fetch fails
4. Renders the list of workouts with status badges

**Usage Example:**
\`\`\`tsx
<ClientWorkouts clientId="ociLJugd1vRbNwnopV1j" clientName="Egor S" />
\`\`\`

## Implementation in Client Details Page

The client details page (`app/clients/[id]/page.tsx`) uses the ClientWorkouts component:

\`\`\`tsx
// Get trainer ID from cookie
const trainerId = getCookie("user_id")

// Fetch client data
const clientData = await getClient(trainerId as string, params.id as string)

// Render client details and workouts
return (
  <div>
    <h2 className="text-xl font-semibold mb-4">Workouts</h2>
    <ClientWorkouts clientId={client.id.toString()} clientName={client.name} />
  </div>
)
\`\`\`

## Troubleshooting

If workouts are not displaying:

1. Check the browser console for errors in the API request
2. Verify the client document has a valid `userId` field
3. Confirm the user has workouts in their collection
4. Check for permission issues in Firebase security rules
5. Ensure the client ID is being passed correctly to the component
6. Verify the API route is correctly extracting the userId from the client document
7. Make sure the `user_id` cookie is set correctly

## Common Issues and Solutions

### Issue: Authentication required error

**Possible causes:**
- The `user_id` cookie is not set
- The cookie value is incorrect
- The user is not logged in

**Solution:**
- Ensure the user is properly logged in
- Check that the authentication system is setting the `user_id` cookie
- Verify the cookie value matches a valid trainer ID in the database

### Issue: Client not found error

**Possible causes:**
- The client ID in the URL is incorrect
- The client document doesn't exist in the trainer's clients collection

**Solution:**
- Check the client ID in the URL
- Verify the client document exists in Firebase
- Ensure the trainer has access to this client

### Issue: Empty workouts array returned

**Possible causes:**
- The client document doesn't have a userId field
- The userId is incorrect
- The user doesn't have any workouts
- Permission issues when accessing the workouts collection

**Solution:**
- Check the client document in Firebase to ensure it has a valid userId field
- Verify the user has workouts in their collection
- Check Firebase security rules to ensure the application has permission to read the workouts
