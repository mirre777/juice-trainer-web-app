# Component Architecture Documentation

This document outlines the component architecture and organization patterns used in the Juice Coaching Platform.

## Table of Contents
- [Directory Structure](#directory-structure)
- [Component Categories](#component-categories)
- [Naming Conventions](#naming-conventions)
- [Component Patterns](#component-patterns)
- [State Management](#state-management)
- [Data Fetching](#data-fetching)

## Directory Structure

### Core Directories
\`\`\`
components/
├── ui/                 # shadcn/ui base components
├── auth/              # Authentication components
├── calendar/          # Calendar and scheduling components
├── clients/           # Client management components
├── dashboard-alt/     # Alternative dashboard components
├── feedback/          # User feedback components
├── finance/           # Financial tracking components
├── google-calendar/   # Google Calendar integration
├── google-sheets/     # Google Sheets integration
├── invitation/        # Client invitation components
├── payment/           # Payment processing components
├── programs/          # Workout program components
├── shared/            # Reusable utility components
└── workout/           # Workout-specific components
\`\`\`

## Component Categories

### 1. UI Components (`components/ui/`)
Base components from shadcn/ui library:
- `button.tsx` - Button variants and states
- `card.tsx` - Card containers
- `dialog.tsx` - Modal dialogs
- `form.tsx` - Form components
- `input.tsx` - Input fields
- `table.tsx` - Data tables
- `toast.tsx` - Notification toasts

### 2. Feature Components
Domain-specific components organized by feature:

#### Authentication (`components/auth/`)
- `auth-form.tsx` - Login/signup forms
- `auth-layout.tsx` - Authentication page layout
- `logout-button.tsx` - Logout functionality
- `protected-route.tsx` - Route protection wrapper

#### Client Management (`components/clients/`)
- `add-client-modal.tsx` - Client creation dialog
- `client-card.tsx` - Client information display
- `client-invitation-dialog.tsx` - Invitation management
- `clients-list.tsx` - Client listing with filters
- `delete-client-dialog.tsx` - Client deletion confirmation

#### Workout Management (`components/workout/`)
- `exercise-card.tsx` - Individual exercise display
- `exercise-set.tsx` - Set tracking component
- `pr-card.tsx` - Personal record display
- `weekly-tracker.tsx` - Weekly progress tracking

### 3. Layout Components
- `juice-layout.tsx` - Main application layout
- `unified-header.tsx` - Application header
- `page-layout.tsx` - Standard page wrapper

## Naming Conventions

### File Naming
- **kebab-case** for file names: `client-workout-card.tsx`
- **PascalCase** for component names: `ClientWorkoutCard`
- **camelCase** for hooks: `useClientData`

### Component Naming Patterns
- **Modal/Dialog components**: `*-modal.tsx` or `*-dialog.tsx`
- **Page components**: `*-page.tsx` or `*Page.tsx`
- **Layout components**: `*-layout.tsx`
- **Card components**: `*-card.tsx`
- **List components**: `*-list.tsx`

## Component Patterns

### 1. Client/Server Component Pattern
\`\`\`typescript
// Server Component (default)
export default function ClientsPage() {
  return <ClientsPageClient />
}

// Client Component
'use client'
export function ClientsPageClient() {
  // Client-side logic here
}
\`\`\`

### 2. Compound Component Pattern
\`\`\`typescript
// Card with sub-components
export function ClientCard({ children }) {
  return <div className="client-card">{children}</div>
}

ClientCard.Header = function ClientCardHeader({ children }) {
  return <div className="client-card-header">{children}</div>
}

ClientCard.Content = function ClientCardContent({ children }) {
  return <div className="client-card-content">{children}</div>
}
\`\`\`

### 3. Hook-based Data Fetching
\`\`\`typescript
// Custom hook for data fetching
export function useClientData(clientId: string) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchClientData(clientId).then(setClient).finally(() => setLoading(false))
  }, [clientId])
  
  return { client, loading }
}
\`\`\`

## State Management

### 1. Local State (useState)
Used for component-specific state:
- Form inputs
- Modal open/close states
- Loading states
- UI toggles

### 2. Context API
Used for shared state across component trees:
- `AuthContext` - User authentication state
- `ProgramContext` - Program editing state
- `FeedbackProvider` - User feedback state

### 3. Custom Hooks
Encapsulate complex state logic:
- `useCurrentUser` - Current user data
- `useClientData` - Client information
- `useExerciseHistory` - Exercise tracking data

## Data Fetching

### 1. Server Components
Fetch data at build time or request time:
\`\`\`typescript
export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientsList clients={clients} />
}
\`\`\`

### 2. Client-side Fetching
Use custom hooks for dynamic data:
\`\`\`typescript
'use client'
export function ClientWorkouts({ clientId }: { clientId: string }) {
  const { workouts, loading } = useClientWorkouts(clientId)
  
  if (loading) return <LoadingSpinner />
  return <WorkoutsList workouts={workouts} />
}
\`\`\`

### 3. API Route Integration
Consistent API calling pattern:
\`\`\`typescript
async function fetchClientData(clientId: string) {
  const response = await fetch(`/api/clients/${clientId}`)
  if (!response.ok) throw new Error('Failed to fetch client')
  return response.json()
}
\`\`\`

## Error Handling

### 1. Error Boundaries
Catch and handle component errors:
\`\`\`typescript
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // Error boundary implementation
}
\`\`\`

### 2. Loading States
Consistent loading state handling:
\`\`\`typescript
if (loading) return <PageSkeleton />
if (error) return <ErrorMessage error={error} />
return <ActualContent data={data} />
\`\`\`

### 3. Toast Notifications
User feedback for actions:
\`\`\`typescript
const { toast } = useToast()

const handleSave = async () => {
  try {
    await saveData()
    toast({ title: "Success", description: "Data saved successfully" })
  } catch (error) {
    toast({ title: "Error", description: "Failed to save data", variant: "destructive" })
  }
}
\`\`\`

## Performance Optimization

### 1. Code Splitting
Dynamic imports for large components:
\`\`\`typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
})
\`\`\`

### 2. Memoization
Prevent unnecessary re-renders:
\`\`\`typescript
const MemoizedComponent = memo(function Component({ data }) {
  return <ExpensiveRender data={data} />
})
\`\`\`

### 3. Lazy Loading
Load components when needed:
\`\`\`typescript
const LazyModal = lazy(() => import('./Modal'))
\`\`\`

## Testing Patterns

### 1. Component Testing
Test component behavior and rendering:
\`\`\`typescript
describe('ClientCard', () => {
  it('renders client information', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText(mockClient.name)).toBeInTheDocument()
  })
})
\`\`\`

### 2. Hook Testing
Test custom hook logic:
\`\`\`typescript
describe('useClientData', () => {
  it('fetches client data', async () => {
    const { result } = renderHook(() => useClientData('client-id'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.client).toBeDefined()
  })
})
\`\`\`

## Best Practices

### 1. Component Composition
Prefer composition over inheritance:
\`\`\`typescript
// Good
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid
<Card title="Title" content="Content" />
\`\`\`

### 2. Props Interface
Define clear prop interfaces:
\`\`\`typescript
interface ClientCardProps {
  client: Client
  onEdit?: (client: Client) => void
  onDelete?: (clientId: string) => void
  showActions?: boolean
}
\`\`\`

### 3. Default Props
Use default parameters:
\`\`\`typescript
function ClientCard({ 
  client, 
  showActions = true,
  onEdit = () => {},
  onDelete = () => {}
}: ClientCardProps) {
  // Component implementation
}
\`\`\`

### 4. Accessibility
Ensure components are accessible:
\`\`\`typescript
<button
  aria-label="Delete client"
  onClick={() => onDelete(client.id)}
>
  <TrashIcon />
</button>
\`\`\`

This architecture ensures maintainable, scalable, and performant components throughout the Juice Coaching Platform.
