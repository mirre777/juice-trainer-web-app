# State Management Documentation

This document outlines the state management patterns and practices used in the Juice Coaching Platform application.

## Table of Contents

1. [Overview](#overview)
2. [State Management Patterns](#state-management-patterns)
3. [Global State](#global-state)
4. [Component State](#component-state)
5. [Server State](#server-state)
6. [Persistence](#persistence)
7. [Demo Mode State](#demo-mode-state)
8. [Real-time State](#real-time-state)
9. [Best Practices](#best-practices)
10. [Future Improvements](#future-improvements)

## Overview

The Juice Coaching Platform uses React's built-in state management capabilities without relying on external state management libraries. This approach keeps the codebase simpler and aligns with React's philosophy while still being powerful enough for our application's needs.

## State Management Patterns

### React's Built-in State Management

We primarily use React's built-in hooks for state management:

- **useState**: For component-local state
- **useReducer**: For more complex state logic
- **useContext**: For sharing state across components
- **useEffect**: For side effects and lifecycle management

### Custom Hooks

We extract reusable state logic into custom hooks to promote code reuse and separation of concerns:

- `useToast` - For managing toast notifications
- `useGoogleAuth` - For Google authentication
- `useCurrentUser` - For accessing the current user
- `useClientData` - For accessing client data
- `useInvitation` - For managing invitations
- `usePathDetection` - For detecting the current path
- `useErrorHandler` - For handling errors consistently

## Global State

Global state is managed using React's Context API. We have several context providers:

### ProgramContext

Located in `contexts/program-context.tsx`, this context manages workout program state.

\`\`\`tsx
// Usage example
import { useProgramContext } from '@/contexts/program-context';

function MyComponent() {
  const { program, saveProgram } = useProgramContext();
  // Use program state and methods
}
\`\`\`

### ToastContext

Located in `components/toast-provider.tsx`, this context manages toast notifications.

\`\`\`tsx
// Usage example
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast.success({ title: 'Success', description: 'Operation completed successfully' });
  };
}
\`\`\`

### AuthContext

Authentication state is managed through custom hooks that interact with the authentication API.

\`\`\`tsx
// Usage example
import { useGoogleAuth } from '@/hooks/use-google-auth';

function MyComponent() {
  const { isAuthenticated, login, logout } = useGoogleAuth();

  if (!isAuthenticated) {
    return <button onClick={login}>Login</button>;
  }

  return <button onClick={logout}>Logout</button>;
}
\`\`\`

## Component State

Component-local state is managed using the `useState` hook. We follow these patterns:

### Form State

\`\`\`tsx
function FormComponent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Form submission logic
}
\`\`\`

### UI State

\`\`\`tsx
function ExpandableComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>

      {isExpanded && <div>Expanded content</div>}
    </div>
  );
}
\`\`\`

### Data Fetching State

\`\`\`tsx
function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
}
\`\`\`

## Real-time State

For real-time updates, we use Firestore's `onSnapshot` listeners:

\`\`\`tsx
function RealtimeComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener
    const unsubscribe = subscribeToData((newData) => {
      setData(newData);
      setLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Render component with real-time data
}
\`\`\`

The subscription functions are defined in service files:

\`\`\`typescript
// lib/firebase/client-service.ts
export function subscribeToClients(trainerId: string, callback: (clients: Client[]) => void) {
  const clientsCollectionRef = collection(db, "users", trainerId, "clients");

  // Set up the real-time listener
  const unsubscribe = onSnapshot(clientsCollectionRef, (snapshot) => {
    const clients = snapshot.docs.map(doc => mapClientData(doc.id, doc.data()));
    callback(clients);
  }, (error) => {
    console.error("Error subscribing to clients:", error);
  });

  // Return the unsubscribe function
  return unsubscribe;
}
\`\`\`

## Server State

For server-side state and data fetching, we use:

### Server Components

Next.js Server Components fetch data on the server and pass it to client components.

\`\`\`tsx
// app/page.tsx (Server Component)
async function Page() {
  const data = await fetchDataOnServer();

  return <ClientComponent initialData={data} />;
}
\`\`\`

### API Routes

API routes handle data fetching and mutations on the server.

\`\`\`tsx
// app/api/data/route.ts
export async function GET() {
  // Fetch data from database
  return Response.json({ data });
}

export async function POST(request) {
  const body = await request.json();
  // Process data
  return Response.json({ success: true });
}
\`\`\`

### Server Actions

Server Actions handle form submissions and data mutations.

\`\`\`tsx
// actions.ts
'use server'

export async function submitForm(formData: FormData) {
  // Process form data on the server
  return { success: true };
}
\`\`\`

## Persistence

We use several methods to persist state:

### localStorage

Used for persisting user preferences and non-sensitive data.

\`\`\`tsx
// Initialize state from localStorage
const [preferences, setPreferences] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('userPreferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  }
  return defaultPreferences;
});

// Save to localStorage when state changes
useEffect(() => {
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
}, [preferences]);
\`\`\`

### Cookies

Used for authentication tokens and session management.

\`\`\`tsx
// lib/auth/token-service.ts
export async function storeTokens(tokenData: TokenData): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: 'accessToken',
    value: await encrypt(tokenData.access_token),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}
\`\`\`

### Firebase

Used for persisting application data.

\`\`\`tsx
// Example of saving data to Firebase
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

async function saveUserData(userId, userData) {
  try {
    await setDoc(doc(db, "users", userId), userData);
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error };
  }
}
\`\`\`

## Demo Mode State

The application includes a demo mode that uses mock data instead of real data. This is implemented using:

### isDemo Prop

Components accept an `isDemo` prop to determine whether to use mock data.

\`\`\`tsx
function MyComponent({ isDemo = false }) {
  // Use mock data if in demo mode, otherwise fetch real data
  const data = isDemo ? mockData : useRealDataFromFirebase();

  return (
    <div>
      {/* Render the same UI regardless of data source */}
      {data.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
\`\`\`

### Mock Data

Mock data is defined in `lib/demo-data.ts` and used in demo mode.

\`\`\`tsx
// lib/demo-data.ts
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

// Usage in a component
import { mockClients } from '@/lib/demo-data';

function ClientsList({ isDemo = false }) {
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

## Best Practices

1. **Keep state as local as possible** - Only lift state up when necessary
2. **Use context sparingly** - Context is not a replacement for props
3. **Extract reusable state logic into custom hooks**
4. **Separate UI state from data state**
5. **Use the appropriate persistence mechanism** for different types of data
6. **Handle loading and error states consistently**
7. **Avoid prop drilling** by using context or component composition
8. **Use the isDemo prop** to determine whether to use mock data
9. **Clean up real-time listeners** in useEffect return functions
10. **Use optimistic UI updates** for a better user experience

## Future Improvements

1. **Consider adopting a lightweight state management library** like Zustand for more complex state
2. **Implement more robust caching strategies** for API data
3. **Add state persistence with more robust storage options** like IndexedDB
4. **Standardize data fetching patterns** across the application
5. **Enhance demo mode** with more comprehensive mock data and interactions
6. **Implement more granular real-time subscriptions** to minimize unnecessary updates
