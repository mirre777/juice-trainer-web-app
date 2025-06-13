# Error Handling Documentation

This document outlines the error handling system implemented in the Juice Coaching Platform.

## Table of Contents

1. [Overview](#overview)
2. [Error Types](#error-types)
3. [Error Handling Utilities](#error-handling-utilities)
4. [Client-Side Error Handling](#client-side-error-handling)
5. [Server-Side Error Handling](#server-side-error-handling)
6. [API Error Handling](#api-error-handling)
7. [Component Error Handling](#component-error-handling)
8. [Error Boundaries](#error-boundaries)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

## Overview

The Juice Coaching Platform implements a unified error handling system that provides consistent error management across the application. The system is designed to:

- Standardize error types and formats
- Provide context-specific error handling utilities
- Improve debugging with detailed error information
- Enhance user experience with appropriate error messages
- Facilitate error logging and monitoring

## Error Types

Errors are categorized using the `ErrorType` enum in `lib/utils/error-handler.ts`:

\`\`\`typescript
export enum ErrorType {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = "auth/invalid-credentials",
  AUTH_USER_NOT_FOUND = "auth/user-not-found",
  // ... other auth errors

  // Database errors
  DB_CONNECTION_ERROR = "db/connection-error",
  DB_DOCUMENT_NOT_FOUND = "db/document-not-found",
  // ... other database errors

  // API errors
  API_INVALID_REQUEST = "api/invalid-request",
  API_MISSING_PARAMS = "api/missing-params",
  // ... other API errors

  // Integration errors
  INTEGRATION_GOOGLE_CALENDAR = "integration/google-calendar",
  INTEGRATION_GOOGLE_SHEETS = "integration/google-sheets",
  // ... other integration errors

  // Client errors
  CLIENT_VALIDATION = "client/validation",
  CLIENT_NETWORK = "client/network",
  // ... other client errors

  // General errors
  UNKNOWN_ERROR = "general/unknown",
  NOT_IMPLEMENTED = "general/not-implemented",
  // ... other general errors
}
\`\`\`

## Error Handling Utilities

The core error handling utilities are defined in `lib/utils/error-handler.ts`:

### AppError Interface

\`\`\`typescript
export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
  context?: Record<string, any>
  timestamp: number
  statusCode?: number
}
\`\`\`

### Error Creation and Handling Functions

- `createError`: Creates a standardized error object
- `logError`: Logs error details to the console
- `handleClientError`: Handles client-side errors
- `handleServerError`: Handles server-side errors
- `handleApiError`: Handles API errors
- `tryCatch`: Utility for try/catch patterns that returns typed results

## Client-Side Error Handling

### useErrorHandler Hook

The `useErrorHandler` hook in `hooks/use-error-handler.ts` provides a consistent way to handle errors in React components:

\`\`\`typescript
const {
  error,           // Current error state
  loading,         // Loading state
  handleError,     // Function to handle errors
  clearError,      // Function to clear the current error
  executeWithErrorHandling  // Wrapper for async functions with error handling
} = useErrorHandler({
  component: "ComponentName",
  showToast: true,
  defaultErrorMessage: "An error occurred"
});
\`\`\`

### Usage Example

\`\`\`typescript
const { executeWithErrorHandling, loading, error } = useErrorHandler({
  component: "ClientList",
  showToast: true
});

const fetchClients = async () => {
  const result = await executeWithErrorHandling(
    async () => {
      return await clientService.getClients();
    },
    "fetchClients"
  );
  
  if (result) {
    setClients(result);
  }
};
\`\`\`

## Server-Side Error Handling

Server-side error handling uses the `handleServerError` function:

\`\`\`typescript
try {
  // Server-side operation
} catch (error) {
  const appError = handleServerError(error, {
    service: "AuthService",
    operation: "loginUser",
    message: "Failed to authenticate user",
    errorType: ErrorType.AUTH_INVALID_CREDENTIALS
  });
  
  // Handle the error appropriately
  return { error: appError };
}
\`\`\`

## API Error Handling

API routes use the `handleApiError` function to standardize error responses:

\`\`\`typescript
export async function GET(request: Request) {
  try {
    // API logic
    return Response.json({ data });
  } catch (error) {
    const { error: appError, statusCode } = handleApiError(error, {
      route: "GET /api/resource",
      requestId: requestId
    });
    
    return Response.json({ error: appError }, { status: statusCode });
  }
}
\`\`\`

## Component Error Handling

Components should use the `useErrorHandler` hook for handling errors:

\`\`\`tsx
function MyComponent() {
  const { executeWithErrorHandling, loading, error } = useErrorHandler({
    component: "MyComponent"
  });
  
  const handleSubmit = async (data) => {
    await executeWithErrorHandling(
      async () => {
        await submitData(data);
        // Success handling
      },
      "handleSubmit"
    );
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    // Component JSX
  );
}
\`\`\`

## Error Boundaries

The application uses React Error Boundaries to catch rendering errors:

\`\`\`tsx
// In app/layout.tsx or other layout components
import { ErrorBoundary } from '@/components/error-boundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}
\`\`\`

The `ErrorBoundary` component in `components/error-boundary.tsx` provides a fallback UI when rendering errors occur.

## Best Practices

1. **Use Typed Errors**: Always use the `ErrorType` enum for error types
2. **Provide Context**: Include relevant context information in error objects
3. **Handle Async Errors**: Use `executeWithErrorHandling` for async operations
4. **User-Friendly Messages**: Display user-friendly error messages in the UI
5. **Log Detailed Errors**: Log detailed error information for debugging
6. **Graceful Degradation**: Provide fallback UI when errors occur
7. **Consistent Error Format**: Use the `AppError` interface for all errors
8. **Error Boundaries**: Use Error Boundaries for component rendering errors
9. **Toast Notifications**: Use toast notifications for transient errors
10. **Clear Error States**: Clear error states when operations are retried

## Examples

### Service Layer Example

\`\`\`typescript
// In a service file
import { tryCatch, ErrorType } from '@/lib/utils/error-handler';

export async function getClientData(clientId: string) {
  return await tryCatch(
    async () => {
      const docRef = doc(db, 'clients', clientId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Client not found');
      }
      
      return docSnap.data() as Client;
    },
    ErrorType.DB_DOCUMENT_NOT_FOUND,
    { clientId, operation: 'getClientData' }
  );
}
\`\`\`

### Component Example

\`\`\`tsx
// In a React component
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useToast } from '@/hooks/use-toast';

function ClientDetails({ clientId }) {
  const [client, setClient] = useState(null);
  const { executeWithErrorHandling, loading, error } = useErrorHandler({
    component: 'ClientDetails',
    showToast: true
  });
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchClient = async () => {
      const result = await executeWithErrorHandling(
        async () => {
          const [data, error] = await clientService.getClientData(clientId);
          if (error) throw error;
          return data;
        },
        'fetchClient'
      );
      
      if (result) {
        setClient(result);
        toast.success({ title: 'Success', description: 'Client data loaded successfully' });
      }
    };
    
    fetchClient();
  }, [clientId, executeWithErrorHandling, toast]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error.message} />;
  if (!client) return <EmptyState message="No client data available" />;
  
  return (
    // Client details UI
  );
}
\`\`\`

### API Route Example

\`\`\`typescript
// In an API route
import { handleApiError } from '@/lib/utils/error-handler';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.clientId) {
      return Response.json(
        { error: 'Missing client ID' },
        { status: 400 }
      );
    }
    
    // Process request
    const result = await processClientData(body);
    
    return Response.json({ data: result });
  } catch (error) {
    const { error: appError, statusCode } = handleApiError(error, {
      route: 'POST /api/clients/process',
      requestBody: body
    });
    
    return Response.json({ error: appError }, { status: statusCode });
  }
}
\`\`\`

### Global Error Handler Example

\`\`\`typescript
// In lib/utils/global-error-handler.ts
import { logError, createError, ErrorType } from './error-handler';

export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = createError(
        ErrorType.UNKNOWN_ERROR,
        event.reason,
        { source: 'unhandledrejection' },
        'Unhandled Promise Rejection'
      );
      
      logError(error);
    });
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      const error = createError(
        ErrorType.UNKNOWN_ERROR,
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        { source: 'window.onerror' },
        'Uncaught Error'
      );
      
      logError(error);
    });
  }
}
\`\`\`

This error handling system provides a robust foundation for managing errors throughout the application. By following these patterns and best practices, we can ensure a consistent and user-friendly error handling experience.
