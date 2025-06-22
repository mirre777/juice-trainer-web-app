# Juice Coaching Platform

A comprehensive coaching platform for fitness professionals to manage clients, workouts, programs, and scheduling.

## 🏗️ **Project Architecture Overview**

This is a **Next.js 14** fitness coaching platform built with:
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Firebase (Auth + Firestore)
- **State Management**: React hooks + Context API
- **Authentication**: Firebase Auth with custom token management
- **Database**: Firestore with subcollection patterns

## 📁 **Key Directory Structure**

\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API routes (auth, clients, invitations)
│   ├── demo/              # Demo mode pages
│   └── [pages]/           # Application pages
├── components/            # React components organized by domain
│   ├── auth/             # Authentication components
│   ├── clients/          # Client management
│   ├── calendar/         # Calendar integration
│   ├── programs/         # Workout programs
│   ├── shared/           # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and services
│   ├── firebase/         # Firebase services
│   ├── auth/             # Authentication services
│   └── utils/            # Helper functions
├── types/                # TypeScript type definitions
└── docs/                 # Comprehensive documentation
\`\`\`

## 🎯 **Core Features & Flows**

### **1. Authentication System**
- **Hybrid approach**: Legacy users + modern Firebase Auth
- **Auto-migration**: Legacy users upgraded seamlessly on login
- **Invitation system**: Universal invite codes for trainers
- **Session management**: HTTP-only cookies + client-readable user IDs

### **2. Client Management**
- **Trainer-Client relationship**: Subcollection pattern in Firestore
- **Invitation flow**: Trainers create clients → Generate invite codes → Clients accept
- **Status tracking**: Pending → Accepted Invitation → Active
- **Real-time updates**: Firestore listeners for live data

### **3. Data Architecture**
\`\`\`
/users/{trainerId}
├── clients: [clientId1, clientId2, ...]  # Array of client IDs
├── /clients/{clientId}                   # Subcollection
│   ├── name, email, status
│   ├── inviteCode: "ABC123"
│   ├── userId: "firebase-user-id"        # Links to user account
│   └── status: "Pending|Active"
\`\`\`

### **4. Demo Mode**
- **Parallel structure**: `/demo/*` routes with mock data
- **Component pattern**: `isDemo` prop switches data sources
- **No authentication**: Public access for exploration

## 🔧 **Technical Patterns**

### **State Management**
- **Local state**: `useState` for component state
- **Global state**: Context API for shared data
- **Server state**: API routes + Firestore
- **Real-time**: `onSnapshot` listeners with cleanup

### **Error Handling**
- **Centralized system**: Custom error types and handlers
- **Graceful degradation**: Fallbacks for failed operations
- **User feedback**: Toast notifications for errors/success

### **Component Organization**
- **Domain-based**: Components grouped by feature area
- **Shared utilities**: Reusable UI components in `/shared`
- **Layout patterns**: Consistent page layouts with `isDemo` support

## 🚀 **Key Workflows**

### **Client Onboarding**
1. Trainer creates client profile (no individual invite codes)
2. System generates invitation link with trainer info
3. Client accepts invitation → Status: "Accepted Invitation"
4. Client creates account → Status: "Active" + account linking

### **Authentication Flow**
1. **Modern users**: Direct Firebase Auth login
2. **Legacy users**: Auto-migration to Firebase Auth
3. **New signups**: Firebase Auth + Firestore profile creation
4. **Invitation signups**: Pending approval workflow

### **Real-time Updates**
- **Client status changes**: Live updates in trainer dashboard
- **User data**: Real-time listeners for profile changes
- **Subscription cleanup**: Proper listener management

## 📊 **Current State & Capabilities**

### **Implemented Features**
✅ Complete authentication system with migration  
✅ Client management with invitation flow  
✅ Real-time data synchronization  
✅ Demo mode for exploration  
✅ Responsive design with mobile support  
✅ Error handling and user feedback  
✅ Google integrations (Calendar, Sheets)  
✅ Payment processing (Stripe)  

### **Architecture Strengths**
- **Scalable data model** with subcollections
- **Flexible authentication** supporting legacy users
- **Real-time capabilities** with Firestore
- **Demo mode** for user acquisition
- **Type safety** with comprehensive TypeScript
- **Component reusability** with shared patterns

### **Technical Debt Areas**
- Some components could be further modularized
- Error handling could be more granular
- Testing coverage needs expansion
- Performance optimizations for large datasets

## 🛠️ **Tech Stack Details**

- **Framework**: Next.js 14 with App Router
- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth, Google OAuth
- **Storage**: Firebase Storage
- **Payment Processing**: Stripe
- **Integrations**: Google Calendar, Google Sheets

## 📋 **Environment Variables**

The application requires the following environment variables:

\`\`\`
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Application
NEXT_PUBLIC_APP_URL=
ENCRYPTION_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
\`\`\`

## 📚 **Documentation**

- [Component Structure](./docs/component-structure.md)
- [State Management](./docs/state-management.md)
- [Firebase Integration](./docs/firebase-integration.md)
- [API Routes](./docs/api-routes.md)
- [Client Creation Flow](./docs/client-creation-flow.md)
- [Authentication Flow](./docs/authentication-flow.md)
- [Error Handling](./docs/error-handling.md)

## 🚀 **Getting Started**

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 **Demo Mode**

The application includes a comprehensive demo mode that showcases functionality without requiring real data:

- All `/demo/[feature]` routes display mock data
- Components use the `isDemo` prop to determine whether to show mock data
- Mock data is defined in `lib/demo-data.ts`
- Demo mode maintains the same component structure as production mode

To implement demo functionality in a component:
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

## 🔄 **Active Work Items**

- Fixing logout functionality
- Implementing marketplace redirects
- Fixing a client-side exception on the `/clients` page

---

The project demonstrates a well-architected fitness coaching platform with thoughtful consideration for user experience, data relationships, and technical scalability. The dual-mode approach (demo/production) and seamless authentication migration show sophisticated product thinking.
