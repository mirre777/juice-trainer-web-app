# Demo Mode Documentation

This document outlines how demo mode is implemented in the Juice Coaching Platform.

## Overview

Demo mode allows users to explore the application's features without requiring real data or authentication. It's implemented using:

1. Separate routes under `/demo/[feature]`
2. Mock data for all features
3. The `isDemo` prop to conditionally render mock data

## Implementation

### Demo Routes

Demo routes are located under the `/demo` directory in the app router:

- `/demo/overview` - Overview dashboard with mock data
- `/demo/clients` - Client management with mock data
- `/demo/programs` - Program management with mock data
- `/demo/calendar` - Calendar with mock events
- `/demo/finance` - Finance dashboard with mock data
- `/demo/settings` - Settings page with mock data
- `/demo/sessions` - Sessions page with mock data
- `/demo/workouts` - Workouts page with mock data

### Mock Data

Mock data is defined in `lib/demo-data.ts`:

\`\`\`typescript
// Example mock data structure
export const mockClients = [
  {
    id: 'client-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    // ...other properties
  },
  // ...more clients
];

export const mockPrograms = [
  {
    id: 'program-1',
    name: 'Strength Training',
    description: 'A program focused on building strength',
    // ...other properties
  },
  // ...more programs
];

// ...other mock data
\`\`\`

### isDemo Prop

Components accept an `isDemo` prop to determine whether to use mock data:

\`\`\`tsx
function ClientsList({ isDemo = false }) {
  // Use mock data if in demo mode, otherwise fetch real data
  const clients = isDemo ? mockClients : useRealClientsFromFirebase();
  
  return (
    <div>
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}
\`\`\`

### Page Layout Components

Page layout components are shared between real and demo pages, with the `isDemo` prop determining the data source:

\`\`\`tsx
// app/demo/clients/page.tsx
export default function DemoClientsPage() {
  return <ClientsPageLayout isDemo={true} />;
}

// app/clients/page.tsx
export default function ClientsPage() {
  return <ClientsPageLayout isDemo={false} />;
}
\`\`\`

## Best Practices

1. **Consistent Mock Data** - Mock data should be realistic and consistent across features
2. **Shared Components** - Use the same components for both real and demo modes
3. **isDemo Prop** - Always pass the `isDemo` prop to determine the data source
4. **No Authentication** - Demo mode should not require authentication
5. **Read-Only** - Demo mode should be read-only or simulate write operations without actually writing data
6. **Clear Indication** - Clearly indicate to users when they are in demo mode

## Implementation Checklist

When implementing demo mode for a new feature:

1. Create a mock data structure in `lib/demo-data.ts`
2. Add the `isDemo` prop to the page layout component
3. Implement conditional data fetching based on the `isDemo` prop
4. Create a demo page under `/demo/[feature]` that passes `isDemo={true}`
5. Test the demo page to ensure it displays mock data correctly
6. Ensure all interactions work properly in demo mode

## Example Implementation

Here's a complete example of implementing demo mode for a feature:

\`\`\`tsx
// lib/demo-data.ts
export const mockWorkouts = [
  {
    id: 'workout-1',
    name: 'Upper Body',
    exercises: [
      { name: 'Bench Press', sets: 3, reps: '8-10' },
      { name: 'Pull-ups', sets: 3, reps: '8-10' },
      { name: 'Shoulder Press', sets: 3, reps: '8-10' },
    ],
  },
  // ...more workouts
];

// components/workouts/workouts-page-layout.tsx
export function WorkoutsPageLayout({ isDemo = false }) {
  // Use mock data if in demo mode, otherwise fetch real data
  const workouts = isDemo ? mockWorkouts : useRealWorkoutsFromFirebase();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Workouts</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map(workout => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  );
}

// app/demo/workouts/page.tsx
export default function DemoWorkoutsPage() {
  return <WorkoutsPageLayout isDemo={true} />;
}

// app/workouts/page.tsx
export default function WorkoutsPage() {
  return <WorkoutsPageLayout isDemo={false} />;
}
