# HostHaven Admin Panel - Enterprise Architecture

## 1. Folder Tree Structure

```
admin/src/
├── main.tsx                      # Entry point
├── App.tsx                       # Root component with routing
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Barrel export
│   └── auth.types.ts             # Auth, RBAC, API types
├── stores/                       # Zustand state management
│   ├── index.ts                  # Barrel export
│   └── authStore.ts              # Auth state & permissions
├── lib/                          # Core utilities
│   ├── apiClient.ts              # Axios client with interceptors
│   ├── utils.ts                  # Utility functions
│   ├── api.ts                    # Base API definitions
│   ├── analytics.ts
│   ├── bookings.ts
│   ├── dashboard.ts
│   ├── inventory.ts
│   ├── notifications.ts
│   ├── payments.ts
│   ├── properties.ts
│   ├── reviews.ts
│   ├── services.ts
│   ├── settings.ts
│   ├── support.ts
│   ├── temples.ts
│   ├── users.ts
│   └── vendors.ts
├── components/                   # Reusable components
│   ├── layout/                   # Layout components
│   │   ├── Layout.tsx            # Original layout (legacy)
│   │   └── Layouts.tsx           # Enterprise layouts
│   │   │   ├── AdminLayout       # Main admin sidebar layout
│   │   │   ├── AuthLayout        # Login/register layout
│   │   │   └── BlankLayout       # Error/empty layouts
│   │   ├── index.ts              # Layout exports
│   │   └── Sidebar.tsx           # Navigation sidebar
│   ├── ui/                       # Shadcn UI components
│   └── ProtectedRoute.tsx        # Route guards
├── pages/                        # Page components (lazy loaded)
│   ├── Dashboard.tsx
│   ├── Bookings.tsx
│   ├── BookingDetails.tsx
│   ├── Properties.tsx
│   ├── PropertyDetails.tsx
│   ├── PropertyApproval.tsx
│   ├── Vendors.tsx
│   ├── VendorDetails.tsx
│   ├── VendorApproval.tsx
│   ├── Users.tsx
│   ├── UserDetails.tsx
│   ├── Payments.tsx
│   ├── Services.tsx
│   ├── AddService.tsx
│   ├── Reviews.tsx
│   ├── Notifications.tsx
│   ├── Analytics.tsx
│   ├── Settings.tsx
│   ├── Support.tsx
│   ├── Inventory.tsx
│   ├── AdminLogin.tsx
│   ├── LoadingPage.tsx
│   ├── ErrorPage.tsx
│   └── Success.tsx
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Legacy auth context
├── routes.tsx                    # Route definitions (NEW)
└── assets/                       # Static assets
    └── logo.png
```

## 2. Routes Configuration (routes.tsx)

### Key Features:

- **Lazy Loading**: All pages loaded dynamically
- **Code Splitting**: Separate chunks per route
- **Suspense Fallback**: Loading spinner during load
- **Protected Routes**: Auth & permission checks
- **Role-Based Access**: Permission-based navigation

### Route Structure:

```typescript
// Main routes array
const routes = [
  // Protected admin routes
  {
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/vendors', element: <Vendors /> },
      { path: '/vendors/:id', element: <VendorDetails /> },
      // ... more routes
    ]
  },
  // Guest routes (login)
  {
    element: <GuestRoute><AuthLayout /></GuestRoute>,
    children: [
      { path: '/auth/login', element: <AdminLogin /> }
    ]
  },
  // Error pages
  { path: '/unauthorized', element: <ErrorPage /> },
  { path: '/404', element: <ErrorPage /> },
]
```

## 3. ProtectedRoute Implementation

### Features:

- **Authentication Check**: Validates user is logged in
- **Role-Based Access**: Checks user roles
- **Permission-Based Access**: Validates required permissions
- **Redirect Logic**: Smart redirect to login/unauthorized
- **State Preservation**: Stores intended destination

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}
```

## 4. Layout System

### AdminLayout

- Persistent sidebar navigation
- Collapsible on mobile
- User profile section
- Role-aware navigation filtering
- Breadcrumb support

### AuthLayout

- Centered card design
- Logo display
- Minimal decoration

### BlankLayout

- No decorations
- For error pages

## 5. API Client (apiClient.ts)

### Features:

- **Axios Instance**: Pre-configured base client
- **Request Interceptors**: Auth token injection
- **Response Interceptors**: Error handling, token refresh
- **Token Refresh**: Automatic token refresh on 401
- **Error Transformation**: Consistent error format
- **Type Safety**: Generic response types

```typescript
class ApiClient {
  get<T>(url, params?);
  post<T>(url, data?);
  put<T>(url, data?);
  patch<T>(url, data?);
  delete<T>(url);
  upload<T>(url, formData, onProgress?);
}
```

## 6. Auth Store (authStore.ts)

### State:

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Actions:

- `login(credentials)` - Authenticate user
- `logout()` - Clear session
- `verifyMFA(code)` - MFA verification
- `refreshUser()` - Update user data
- `checkPermission(permission)` - Permission check
- `checkAnyPermission(permissions)` - Any permission check
- `hasRole(roles)` - Role check

## 7. RBAC System

### Roles:

- super_admin
- platform_admin
- finance_admin
- support_admin
- content_admin
- property_manager
- front_desk
- housekeeping
- vendor_manager
- vendor_staff

### Permissions Pattern:

`module:action` (e.g., 'vendors:full', 'bookings:view')

### Permission Matrix:

| Module   | Super Admin | Finance Admin | Property Manager |
| -------- | ----------- | ------------- | ---------------- |
| Vendors  | full        | view          | view             |
| Payments | full        | full          | view_own         |
| Settings | full        | limited       | no_access        |

## 8. Navigation Configuration

### Dynamic Navigation:

- Permission-based menu filtering
- Hierarchical menu support
- Active state tracking
- Mobile responsive

### Menu Structure:

```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', children: [...] },
  // ...
]
```

## 9. Usage Examples

### Using ProtectedRoute:

```tsx
// Require specific permission
<ProtectedRoute requiredPermissions={['vendors:full']}>
  <VendorManagement />
</ProtectedRoute>

// Require specific role
<ProtectedRoute requiredRoles={['super_admin', 'platform_admin']}>
  <SettingsPage />
</ProtectedRoute>
```

### Using PermissionGuard:

```tsx
// Conditionally render content
<PermissionGuard permission="payments:full">
  <ExportButton />
</PermissionGuard>
```

### Using Auth Store:

```tsx
const { user, checkPermission } = useAuthStore();

if (checkPermission("settings:full")) {
  // Show settings
}
```

## 10. Migration Notes

### New Files:

- `routes.tsx` - Centralized routing
- `types/auth.types.ts` - Type definitions
- `stores/authStore.ts` - State management
- `lib/apiClient.ts` - API client
- `components/layout/Layouts.tsx` - New layouts
- `components/ProtectedRoute.tsx` - Enhanced guards

### Updated Files:

- `App.tsx` - Uses new routing

### Removed Dependencies:

- Old `AuthContext` (replaced by stores)
