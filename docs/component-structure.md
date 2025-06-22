# Component Structure

This document outlines the organization of components in the Juice Coaching Platform.

## Folder Structure

Components are organized by feature or domain:

### Authentication Components

- `components/auth/`
  - `auth-form.tsx` - Login/signup form
  - `auth-layout.tsx` - Layout for auth pages
  - `logout-button.tsx` - Button for logging out

### Dashboard Components

- `components/dashboard-alt/` (New dashboard components)
  - `client-overview-chart.tsx` - Client overview visualization
  - `workout-completion-chart.tsx` - Workout completion visualization
  - `client-retention-chart.tsx` - Client retention visualization
  - `recent-activities-list.tsx` - Recent activities list
  - `upcoming-sessions-list.tsx` - Upcoming sessions list
  - `performance-metrics.tsx` - Performance metrics
  - `client-requests.tsx` - Client requests display

### Client Management Components

- `components/clients/`
  - `client-card.tsx` - Client card component
  - `clients-list.tsx` - Client list component
  - `add-client-modal.tsx` - Modal for adding new clients
  - `client-invitation-dialog.tsx` - Dialog for client invitations
  - `delete-client-dialog.tsx` - Dialog for deleting clients
  - `client-quick-view-modal.tsx` - Modal for quick client view
  - `clients-filter-bar.tsx` - Filter bar for clients list
  - `client-actions.tsx` - Actions for client management
  - `client-linking-service.tsx` - Service for linking clients to users

### Workout Components

- `components/workout/`
  - `emoji-picker.tsx` - Emoji reaction picker
  - `smiley-face.tsx` - Smiley face component
  - `weekly-tracker.tsx` - Weekly workout tracker
  - `pr-card.tsx` - Personal record card
  - `exercise-history-table.tsx` - Exercise history table
  - `exercise-metrics.tsx` - Exercise metrics display
  - `exercise-card.tsx` - Exercise card component
  - `exercise-history-chart.tsx` - Exercise history chart
  - `exercise-set.tsx` - Exercise set component

### Program Components

- `components/programs/`
  - `program-editor.tsx` - Program editing interface
  - `program-preview.tsx` - Program preview component
  - `new-program-dialog.tsx` - Dialog for creating new programs
  - `routine-editor.tsx` - Routine editing interface
  - `exercise-editor.tsx` - Exercise editing interface
  - `week-editor.tsx` - Week editing interface
  - `add-exercise-form.tsx` - Form for adding exercises
  - `google-sheets-import.tsx` - Google Sheets import component
  - `sheets-import-dialog.tsx` - Dialog for importing from sheets
  - `programs-page-layout.tsx` - Layout for programs pages

### Calendar Components

- `components/calendar/`
  - `calendar-integration.tsx` - Calendar integration component
  - `calendar-list-view.tsx` - Calendar list view
  - `session-card.tsx` - Session card component
  - `new-session-dialog.tsx` - Dialog for creating new sessions
  - `new-event-dialog.tsx` - Dialog for creating new events
  - `calendar-integration-button.tsx` - Button for calendar integration
  - `calendar-page-layout.tsx` - Layout for calendar pages
  - `calendar-page-layout-client.tsx` - Client-specific calendar layout

### Google Integration Components

- `components/google-calendar/`
  - `calendar-integration.tsx` - Google Calendar integration
  - `auth-button.tsx` - Authentication button
  - `calendar-list.tsx` - Calendar list component
  - `calendar-events.tsx` - Calendar events component
  - `event-create-dialog.tsx` - Event creation dialog
  - `simple-auth-button.tsx` - Simplified auth button
  - `simple-integration.tsx` - Simplified integration component

- `components/google-sheets/`
  - `auth-button.tsx` - Authentication button for Sheets
  - `black-auth-button.tsx` - Black-styled auth button
  - `sheets-integration.tsx` - Sheets integration component

### Finance Components

- `components/finance/`
  - `finance-page-layout.tsx` - Layout for finance pages

### Payment Components

- `components/payment/`
  - `checkout-form.tsx` - Checkout form component
  - `pricing-card.tsx` - Pricing card component

### Layout Components

- `components/layout/`
  - `overview-page-layout.tsx` - Layout for overview pages

### Shared Components

- `components/shared/`
  - `client-initials.tsx` - Client initials display
  - `search-filter-bar.tsx` - Search and filter bar
  - `search-input.tsx` - Search input component
  - `filter-button.tsx` - Filter button component
  - `action-button.tsx` - Action button component
  - `page-layout.tsx` - Generic page layout
  - `unified-page-layout.tsx` - Unified page layout
  - `empty-state.tsx` - Empty state component
  - `loading-spinner.tsx` - Loading spinner component
  - `personal-records-display.tsx` - Personal records display
  - `emoji-reaction.tsx` - Emoji reaction component
  - `weekly-tracker.tsx` - Weekly tracker component
  - `view-history-link.tsx` - View history link component
  - `whatsapp-chat-button.tsx` - WhatsApp chat button
  - `row-green-cta.tsx` - Green CTA row component

### UI Components

- `components/ui/`
  - Various UI components like buttons, cards, etc. from shadcn/ui
  - `card-styles.tsx` - Card styling utilities
  - `card-container.tsx` - Card container component
  - `row-cta-buttons.tsx` - Row CTA buttons
  - `active-tag.tsx` - Active tag component
  - `progress.tsx` - Progress bar component
  - `toast.tsx` - Toast notification component

### Invitation Components

- `components/invitation/`
  - `invitation-code-entry.tsx` - Invitation code entry component
  - `app-download-qr.tsx` - App download QR code component

### Firebase Components

- `components/firebase/`
  - `firebase-workout-card.tsx` - Firebase workout card
  - `firebase-workout-card-v2.tsx` - Updated Firebase workout card

### Root Components

- `components/`
  - `unified-header.tsx` - Main header component
  - `juice-layout.tsx` - Main layout for Juice app
  - `client-card.tsx` - Client card component
  - `workout-card.tsx` - Workout card component
  - `client-workout-view.tsx` - Client workout view
  - `shared-workout-card.tsx` - Shared workout card
  - `shared-workout-cardv2.tsx` - Updated shared workout card
  - `shared-workout-display.tsx` - Shared workout display
  - `workout-page-layout.tsx` - Workout page layout
  - `swipe-navigation.tsx` - Swipe navigation component
  - `clients-page-layout.tsx` - Clients page layout
  - `testimonial.tsx` - Testimonial component
  - `body-fat-calculator.tsx` - Body fat calculator
  - `toast-provider.tsx` - Toast notification provider
  - `revenue-chart.tsx` - Revenue chart component
  - `quick-stats.tsx` - Quick stats component
  - `error-boundary.tsx` - Error boundary component
  - `error-handling-example.tsx` - Example of error handling

## Component Patterns

### Page Layout Components

Page layout components follow this pattern:
- Accept an `isDemo` prop to determine whether to show mock data
- Handle data fetching or use mock data based on the `isDemo` prop
- Provide consistent layout and UI regardless of data source
- Include real-time listeners for data that needs live updates

Example:
\`\`\`tsx
export function SomePageLayout({ isDemo = false, children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isDemo) {
      setData(mockData);
      setLoading(false);
      return;
    }
    
    // Set up real-time listener
    const unsubscribe = subscribeToData((newData) => {
      setData(newData);
      setLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [isDemo]);
  
  return (
    <div className="layout-container">
      <header>...</header>
      <main>
        {loading ? (
          <LoadingSpinner />
        ) : (
          data.map(item => (...))
        )}
      </main>
      {children}
    </div>
  );
}
\`\`\`

### UI Components

UI components are primarily from shadcn/ui with custom styling:
- Button variants: primary, secondary, outline, ghost
- Card components with consistent styling
- Form components with validation
- Dialog and modal components for interactions

### Data Display Components

Data display components follow this pattern:
- Accept data as props
- Handle loading and error states
- Provide empty states when no data is available
- Use consistent styling and layout

### Form Components

Form components follow this pattern:
- Use controlled inputs
- Handle form validation
- Provide feedback on submission
- Handle errors gracefully

## Best Practices

1. Components should be placed in the appropriate folder based on their domain/feature
2. Shared components that are used across multiple domains should be placed in a shared folder
3. UI components should be placed in the `ui` folder
4. Layout components should be placed in the `layout` folder
5. Each component should have a single responsibility
6. Components should be properly typed with TypeScript
7. Components should be properly documented with JSDoc comments
8. Demo functionality should be implemented using the `isDemo` prop
9. Real-time updates should use Firestore's `onSnapshot` listeners
10. Listeners should be properly cleaned up in useEffect return functions
\`\`\`

Finally, let's update the state management documentation:
