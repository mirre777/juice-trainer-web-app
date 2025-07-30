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

#### **A. Invitation Signup**
\`\`\`javascript
// User signs up with invitation code
signupWithUniversalCode({
  email, name, password, universalInviteCode
})
→ Creates user with Firebase Auth
→ Sets status: "pending_approval" 
→ Adds to trainer's pendingUsers list
→ Frontend redirects to download page
\`\`\`

#### **B. Regular Trainer Signup**
\`\`\`javascript
// Standard trainer registration
createUser({
  email, name, password, role: "trainer"
})
→ Creates user with Firebase Auth
→ Frontend redirects to download page
\`\`\`

## 🎯 **User States & Transitions**

### **User States**
1. **Modern User**: `hasFirebaseAuth: true` → Direct login
2. **Legacy User**: `hasFirebaseAuth: false/undefined` → Auto-migration
3. **Pending User**: `status: "pending_approval"` → Awaiting trainer approval
4. **Approved User**: `status: "approved"` → Full platform access

### **State Transitions**
\`\`\`
Legacy User → (Login) → Modern User
Pending User → (Trainer Approval) → Approved User
New Signup → (With Invite) → Pending User
New Signup → (Trainer) → Modern User
\`\`\`

## 🔀 **Response Types & Redirects**

### **Login Responses**
\`\`\`javascript
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
  role: "admin" | "coach" | "client",
  hasFirebaseAuth: boolean, // Indicates if linked to Firebase Auth
  firebaseUid: string, // Firebase Auth UID (when linked)
  status: "pending_approval" | "approved" | "active",
  clients: string[], // Array of client IDs (coaches only)
  trainers: string[], // Array of trainer IDs (clients only)
  inviteCode: string, // Invitation code (if signed up via invite)
  createdAt: timestamp,
  updatedAt: timestamp,
  linkedAt: timestamp // When accounts were linked
  migratedAt: timestamp // When legacy account was migrated
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
