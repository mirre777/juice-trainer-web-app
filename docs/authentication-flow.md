# Authentication Flow Documentation

This document outlines the complete authentication system for the Juice Coaching Platform, including user login, signup, and account migration flows.

## 🔄 **Complete Authentication Flow**

### **Login Flow (`/api/auth/login`)**

The login system handles three types of users seamlessly:

#### **1. Modern Users (hasFirebaseAuth: true)**
\`\`\`javascript
// Direct Firebase Authentication
signInWithEmailAndPassword(auth, email, password)
→ Success: Set auth token → Redirect to /overview
→ Fail: Return specific error (wrong password, rate limit, etc.)
\`\`\`

#### **2. Legacy Users with Existing Firebase Auth**
\`\`\`javascript
// Automatic Account Linking
try {
  signInWithEmailAndPassword(auth, email, password)
  → Success: Link accounts, set hasFirebaseAuth: true → Redirect to /overview
} catch (error) {
  if (error.code === "auth/wrong-password") {
    → Return "Invalid email or password"
  }
}
\`\`\`

#### **3. Legacy Users without Firebase Auth**
\`\`\`javascript
// Automatic Account Migration
try {
  createUserWithEmailAndPassword(auth, email, password)
  → Success: Set hasFirebaseAuth: true → Redirect to /overview
} catch (error) {
  → Handle creation errors appropriately
}
\`\`\`

### **Signup Flow (`/api/auth/signup`)**

#### **A. Trainer Signup (Web Platform)**
\`\`\`javascript
// User signs up at /signup with isTrainerSignup: true
POST /api/auth/signup {
  email, name, password, 
  isTrainerSignup: true,
  inviteCode: undefined
}
→ Creates user with role: "trainer" and Firebase Auth
→ Sets hasFirebaseAuth: true
→ Frontend redirects to /overview (trainer dashboard)
\`\`\`

#### **B. Mobile App User Signup**
\`\`\`javascript
// User signs up at /signup-juice-app with isTrainerSignup: false
POST /api/auth/signup {
  email, name, password,
  isTrainerSignup: false, 
  inviteCode: undefined
}
→ Creates user with NO role and Firebase Auth
→ Sets hasFirebaseAuth: true
→ Frontend redirects to download page
\`\`\`

#### **C. Invitation Signup**
\`\`\`javascript
// User signs up with invitation code from trainer
POST /api/auth/signup {
  email, name, password,
  inviteCode: "ABC123",
  isTrainerSignup: false
}
→ Creates FULLY FUNCTIONAL user account with Firebase Auth
→ Sets status: "pending_approval" (for trainer relationship only)
→ Adds to trainer's pendingUsers list for connection approval
→ User can immediately use mobile app
→ Frontend redirects to download page
\`\`\`

## 🎯 **User States & Transitions**

### **User States**
1. **Trainer User**: `role: "trainer"` → Full platform access at /overview
2. **Mobile App User**: `role: undefined` → Limited access, redirected to mobile success
3. **User with Pending Trainer Connection**: `status: "pending_approval"` → User account is active, but trainer-client relationship awaits approval
4. **Legacy User**: `hasFirebaseAuth: false/undefined` → Auto-migration on login

### **State Transitions**
\`\`\`
Web Signup (isTrainerSignup: true) → Trainer User
Mobile Signup (isTrainerSignup: false) → Mobile App User  
Invite Signup (with code) → Active User → (Trainer Connection Approval) → Client-Trainer Relationship
Legacy User → (Login) → Modern User (role preserved)
\`\`\`

## 🔀 **Response Types & Redirects**

### **Signup Responses**
\`\`\`javascript
// Successful trainer signup
{
  success: true,
  userId: "user-id",
  pendingApproval: false
}
→ Frontend redirects to /overview

// Successful mobile app signup  
{
  success: true,
  userId: "user-id", 
  pendingApproval: false
}
→ Frontend redirects to https://juice.fitness/download-juice-app

// Successful invitation signup
{
  success: true,
  userId: "user-id",
  pendingApproval: true,
  message: "Account created successfully. Waiting for trainer approval."
}
→ Frontend redirects to https://juice.fitness/download-juice-app
\`\`\`

### **Login Responses & Redirects**
\`\`\`javascript
// After successful login, frontend calls /api/auth/me to check role:

// Trainer user
{ role: "trainer", ... } → Redirect to /overview

// Non-trainer user  
{ role: undefined, ... } → Redirect to /mobile-app-success
\`\`\`

// Successful modern user login
{
  success: true,
  userId: "user-id",
  authMethod: "firebase"
}

// Successful auto-linking
{
  success: true, 
  userId: "user-id",
  message: "Login successful! Your accounts have been automatically linked.",
  authMethod: "firebase",
  autoLinked: true
}

// Successful auto-migration
{
  success: true,
  userId: "user-id",
  message: "Login successful! Your account has been upgraded for enhanced security.", 
  authMethod: "firebase",
  migrated: true
}

// Authentication failure
{
  success: false,
  error: "Invalid email or password"
}
\`\`\`

### **Redirect Logic**
- **Successful login** → `/overview`
- **Invitation signup** → `https://juice.fitness/download-juice-app`
- **Regular signup** → `https://juice.fitness/download-juice-app`
- **Authentication failure** → Stay on login page with error

## 🎯 **Role Assignment Strategy**

### **How Roles Are Determined**
The system assigns roles based on the signup method:

#### **Trainer Role Assignment**
- **Trigger**: `isTrainerSignup: true` in signup request
- **Source**: User visits `/signup` (trainer signup page)
- **Result**: `role: "trainer"` assigned in database
- **Access**: Full platform access to all trainer features

#### **No Role Assignment (Mobile Users)**
- **Trigger**: `isTrainerSignup: false` or invitation signup
- **Sources**: 
  - User visits `/signup-juice-app` (mobile app signup)
  - User signs up via invitation link
- **Result**: `role: undefined` in database
- **Access**: Redirected to mobile app download/success pages

#### **Role Detection Logic**
\`\`\`javascript
// In /api/auth/signup route
const role = isTrainerSignup ? "trainer" : undefined

await createUser({
  email, name, password,
  role: role, // "trainer" or undefined
  provider: "email"
})
\`\`\`

### **Frontend Route Determination**
\`\`\`javascript
// In AuthForm component after signup/login
if (userData.role === "trainer") {
  router.push("/overview")  // Trainer dashboard
} else {
  router.push("/mobile-app-success")  // Mobile app instructions
}
\`\`\`

## 🔗 **Trainer-Client Connection Flow**

### **Invitation Process**
1. **User Signs Up**: Creates complete, functional account via invitation
2. **Trainer Notification**: User appears in trainer's "pending users" list
3. **Trainer Decision**: Trainer can approve and either:
   - **Match to Existing Client**: Link user to pre-created client profile
   - **Create New Client**: Generate new client profile for this user
4. **Connection Established**: User-trainer relationship is active

### **Key Points**
- **User account is immediately functional** - can login and use mobile app
- **No user approval needed** - only trainer-client relationship needs approval
- **Trainer flexibility** - can organize clients as needed before connecting
- **Seamless UX** - user doesn't wait for approval to access their account

## 🛡️ **Security Features**

### **Authentication Security**
- **HTTP-only cookies** for auth token storage
- **Password validation** (minimum 6 characters)
- **Rate limiting** protection against brute force
- **Encrypted token storage** using AES encryption
- **Automatic account linking** prevents duplicate accounts

### **Error Handling**
- **Wrong password** → "Invalid email or password" (no account enumeration)
- **Rate limiting** → "Too many login attempts. Please try again later."
- **Weak password** → "Password is too weak. Please choose a stronger password."
- **Network errors** → "Connection error. Please try again."

### **Session Management**
\`\`\`javascript
// Token structure
{
  userId: "firestore-user-id",
  firebaseUid: "firebase-auth-uid", 
  email: "user@example.com",
  role: "trainer|client|admin",
  iat: timestamp,
  exp: timestamp
}

// Cookie Configuration
{
  // Auth token - HttpOnly for security (server-side only)
  auth_token: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  // User ID - Readable by client-side for component data fetching
  user_id: {
    httpOnly: false, // Allows client-side components to read
    secure: true,
    sameSite: "lax", 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}
\`\`\`

## 🔧 **Technical Implementation**

### **Cookie Strategy**
- **`auth_token`** - HttpOnly JWT token for secure API authentication
- **`user_id`** - Client-readable Firestore document ID for component data fetching
- **Security Balance** - Auth token protected, user ID accessible for UX
- **SameSite Policy** - "lax" setting ensures cross-site compatibility
- **Expiration** - 7-day expiration for both cookies

### **Firebase Integration**
- **Client SDK** for frontend authentication
- **Admin SDK** for server-side user management
- **Firestore** for user profiles and application data
- **Firebase Auth** for authentication and session management

### **Database Schema**
\`\`\`javascript
// Users Collection (/users/{userId})
{
  email: string,
  name: string,
  role: "trainer" | undefined, // Only trainers get explicit role
  hasFirebaseAuth: boolean,
  firebaseUid: string,
  status: "pending_approval" | "approved" | "active",
  
  // Trainer-specific fields
  clients: string[], // Array of client IDs (trainers only)
  pendingUsers: string[], // Users awaiting approval (trainers only)
  
  // Client-specific fields  
  trainers: string[], // Array of trainer IDs (clients only)
  inviteCode: string, // Invitation code used during signup
  
  // Timestamps
  createdAt: timestamp,
  updatedAt: timestamp,
  linkedAt: timestamp,
  migratedAt: timestamp
}
\`\`\`

### **API Routes**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/signup` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/invitations/create` - Create invitation
- `GET /api/invitations/[code]` - Get invitation details

## 🔍 **Admin Tools**

### **Manual Account Linking**
For edge cases where automatic linking fails:

\`\`\`javascript
// Check account status
POST /api/admin/check-accounts
{
  "email": "user@example.com"
}

// Manually link accounts
POST /api/admin/link-accounts  
{
  "email": "user@example.com"
}
\`\`\`

### **Account Auditing**
- **Unlinked accounts** - Users in Firestore without `hasFirebaseAuth: true`
- **Orphaned Firebase Auth** - Firebase Auth users without Firestore records
- **Pending approvals** - Users awaiting trainer approval

## 🚀 **Migration Strategy**

### **Legacy User Migration**
The system automatically migrates legacy users during their first login:

1. **Detect legacy user** (`hasFirebaseAuth: false`)
2. **Check for existing Firebase Auth** account
3. **Link if exists** or **create if doesn't exist**
4. **Update Firestore** with `hasFirebaseAuth: true` and `firebaseUid`
5. **Set auth token** and redirect to application

### **Zero-Downtime Migration**
- **Backward compatible** - legacy users can still login
- **Automatic upgrade** - no user action required
- **Graceful fallback** - handles edge cases
- **Audit trail** - tracks migration status

## 📊 **Monitoring & Analytics**

### **Key Metrics**
- **Migration success rate** - % of legacy users successfully migrated
- **Login success rate** - % of login attempts that succeed
- **Account linking rate** - % of accounts successfully linked
- **Error rates** - Track authentication failures by type

### **Logging**
\`\`\`javascript
// Login attempt logging
console.log(`[API:login] 🔐 Login attempt for: ${email}`)
console.log(`[API:login] ✅ Login successful - Method: ${authMethod}`)
console.log(`[API:login] 🔗 Auto-linked accounts for: ${email}`)
console.log(`[API:login] 📈 Migrated legacy user: ${email}`)
\`\`\`

## 🎯 **Best Practices**

1. **Seamless UX** - Users shouldn't notice the migration
2. **Security First** - Always validate credentials before linking
3. **Error Transparency** - Clear error messages for users
4. **Audit Trail** - Log all authentication events
5. **Graceful Degradation** - Handle edge cases gracefully
6. **Performance** - Minimize database calls during auth
7. **Monitoring** - Track migration progress and success rates

## 🔮 **Future Enhancements**

- **Multi-factor authentication** support
- **Social login** integration (Google, Apple)
- **Password reset** functionality
- **Account recovery** options
- **Advanced rate limiting** with IP-based rules
- **Audit dashboard** for account management

## 🚪 **Signup Entry Points**

### **1. Trainer Signup** 
- **URL**: `/signup`
- **Purpose**: Web platform trainer registration
- **Form**: Sets `isTrainerSignup: true`
- **Result**: Full trainer account with dashboard access

### **2. Mobile App Signup**
- **URL**: `/signup-juice-app` 
- **Purpose**: Mobile app user registration
- **Form**: Sets `isTrainerSignup: false`
- **Result**: Mobile user account, redirected to download

### **3. Invitation Signup**
- **URL**: `/signup-juice-app?code=ABC123&tn=TrainerName`
- **Purpose**: Client signup via trainer invitation
- **Form**: Includes invitation code, sets `isTrainerSignup: false`
- **Result**: Pending approval account, trainer notified

### **4. Legacy Migration**
- **Trigger**: Existing user login with `hasFirebaseAuth: false`
- **Process**: Automatic account upgrade during login
- **Result**: Modern account with preserved role
