export type UserRole =
  | "super_admin"
  | "platform_admin"
  | "finance_admin"
  | "support_admin"
  | "content_admin"
  | "property_manager"
  | "front_desk"
  | "housekeeping"
  | "vendor_manager"
  | "vendor_staff"
  | "ADMIN";

export type Permission =
  | "auth:full"
  | "auth:view"
  | "dashboard:full"
  | "dashboard:limited"
  | "dashboard:no_access"
  | "vendors:full"
  | "vendors:view"
  | "vendors:self"
  | "vendors:no_access"
  | "properties:full"
  | "properties:view"
  | "properties:manage_own"
  | "rooms:full"
  | "rooms:view"
  | "rooms:manage_own"
  | "bookings:full"
  | "bookings:view"
  | "bookings:manage_own"
  | "services:full"
  | "services:view"
  | "services:manage_own"
  | "payments:full"
  | "payments:view"
  | "payments:view_own"
  | "payments:no_access"
  | "users:full"
  | "users:limited"
  | "users:view"
  | "users:view_own"
  | "users:no_access"
  | "reviews:full"
  | "reviews:view"
  | "reviews:manage_own"
  | "reviews:respond"
  | "reviews:no_access"
  | "coupons:full"
  | "coupons:manage_own"
  | "coupons:no_access"
  | "notifications:full"
  | "notifications:view"
  | "notifications:send_own"
  | "analytics:full"
  | "analytics:limited"
  | "analytics:no_access"
  | "settings:full"
  | "settings:limited"
  | "settings:no_access"
  | "logs:full"
  | "logs:view"
  | "logs:view_own";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "auth:full",
    "dashboard:full",
    "vendors:full",
    "properties:full",
    "rooms:full",
    "bookings:full",
    "services:full",
    "payments:full",
    "users:full",
    "reviews:full",
    "coupons:full",
    "notifications:full",
    "analytics:full",
    "settings:full",
    "logs:full",
  ],
  platform_admin: [
    "auth:full",
    "dashboard:full",
    "vendors:full",
    "properties:full",
    "rooms:full",
    "bookings:full",
    "services:full",
    "payments:full",
    "users:limited",
    "reviews:full",
    "coupons:full",
    "notifications:full",
    "analytics:full",
    "settings:limited",
    "logs:full",
  ],
  finance_admin: [
    "auth:view",
    "dashboard:full",
    "vendors:view",
    "properties:view",
    "rooms:view",
    "bookings:full",
    "services:view",
    "payments:full",
    "users:view",
    "reviews:view",
    "coupons:full",
    "notifications:view",
    "analytics:full",
    "settings:limited",
    "logs:view",
  ],
  support_admin: [
    "auth:view",
    "dashboard:full",
    "vendors:full",
    "properties:full",
    "rooms:full",
    "bookings:full",
    "services:full",
    "payments:full",
    "users:full",
    "reviews:full",
    "coupons:full",
    "notifications:full",
    "analytics:full",
    "settings:limited",
    "logs:full",
  ],
  content_admin: [
    "auth:view",
    "dashboard:full",
    "vendors:view",
    "properties:full",
    "rooms:full",
    "bookings:view",
    "services:full",
    "payments:view",
    "users:view",
    "reviews:full",
    "coupons:full",
    "notifications:full",
    "analytics:limited",
    "settings:limited",
    "logs:view",
  ],
  property_manager: [
    "auth:view",
    "dashboard:limited",
    "vendors:view",
    "properties:manage_own",
    "rooms:manage_own",
    "bookings:manage_own",
    "services:manage_own",
    "payments:view_own",
    "users:view_own",
    "reviews:manage_own",
    "coupons:manage_own",
    "notifications:send_own",
    "analytics:limited",
    "settings:limited",
    "logs:view_own",
  ],
  front_desk: [
    "auth:view",
    "dashboard:limited",
    "vendors:view",
    "properties:manage_own",
    "rooms:manage_own",
    "bookings:manage_own",
    "services:manage_own",
    "payments:view_own",
    "users:view_own",
    "reviews:view",
    "coupons:no_access",
    "notifications:send_own",
    "analytics:limited",
    "settings:no_access",
    "logs:view_own",
  ],
  housekeeping: [
    "auth:view",
    "dashboard:limited",
    "vendors:view",
    "properties:view",
    "rooms:view",
    "bookings:view",
    "services:view",
    "payments:no_access",
    "users:no_access",
    "reviews:no_access",
    "coupons:no_access",
    "notifications:send_own",
    "analytics:no_access",
    "settings:no_access",
    "logs:view_own",
  ],
  vendor_manager: [
    "auth:view",
    "dashboard:limited",
    "vendors:self",
    "properties:view",
    "rooms:view",
    "bookings:view",
    "services:manage_own",
    "payments:view_own",
    "users:view",
    "reviews:respond",
    "coupons:no_access",
    "notifications:send_own",
    "analytics:limited",
    "settings:no_access",
    "logs:view_own",
  ],
  vendor_staff: [
    "auth:view",
    "dashboard:limited",
    "vendors:self",
    "properties:view",
    "rooms:view",
    "bookings:view",
    "services:manage_own",
    "payments:no_access",
    "users:view",
    "reviews:respond",
    "coupons:no_access",
    "notifications:send_own",
    "analytics:no_access",
    "settings:no_access",
    "logs:view_own",
  ],
  ADMIN: [
    "auth:full",
    "dashboard:full",
    "vendors:full",
    "properties:full",
    "rooms:full",
    "bookings:full",
    "services:full",
    "payments:full",
    "users:full",
    "reviews:full",
    "coupons:full",
    "notifications:full",
    "analytics:full",
    "settings:full",
    "logs:full",
  ],
};

export function hasPermission(
  user: User | null,
  permission: Permission,
): boolean {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(
  user: User | null,
  permissions: Permission[],
): boolean {
  if (!user) return false;
  return permissions.some((p) => hasPermission(user, p));
}
