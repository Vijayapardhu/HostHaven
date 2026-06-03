import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import useAuthStore from "../stores/authStore";
import { Permission, UserRole } from "../types";

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackPath = "/login",
}: {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}) {
  const {
    isAuthenticated: storeAuth,
    user: storeUser,
    isLoading: storeLoading,
    checkAnyPermission,
    hasRole,
  } = useAuthStore();

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!storeAuth || !storeUser) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (
    requiredPermissions.length > 0 &&
    !checkAnyPermission(requiredPermissions)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default function ProtectedRouteWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated: storeAuth, isLoading: storeLoading } = useAuthStore();

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (storeAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function PermissionGuard({
  children,
  permission,
}: {
  children: ReactNode;
  permission: Permission;
}) {
  const { checkPermission } = useAuthStore();

  if (!checkPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}
