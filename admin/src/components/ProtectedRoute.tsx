import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import useAuthStore from "../stores/authStore";
import { Permission, UserRole } from "../types";

function getStoredAuth() {
  try {
    const token =
      localStorage.getItem("admin_token") ||
      localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const adminDataStr = localStorage.getItem("admin_data");
    const userStr = localStorage.getItem("auth-storage");

    let user = null;
    if (adminDataStr) {
      user = JSON.parse(adminDataStr);
    } else if (userStr) {
      const parsed = JSON.parse(userStr);
      user = parsed.state?.user || null;
    }

    return {
      token,
      refreshToken,
      user,
      isAuthenticated: Boolean(token),
    };
  } catch {
    return {
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };
  }
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackPath = "/auth/login",
}: {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}) {
  const location = useLocation();
  const {
    isAuthenticated: storeAuth,
    user: storeUser,
    checkAnyPermission,
    hasRole,
  } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const [hydratedAuth, setHydratedAuth] = useState<{
    token: string | null;
    user: unknown | null;
    isAuthenticated: boolean;
  }>({
    token: null,
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const stored = getStoredAuth();
    setHydratedAuth(stored);
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAuthenticated = storeAuth || hydratedAuth.isAuthenticated;
  const user = storeUser || hydratedAuth.user;

  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
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
  const { isAuthenticated: storeAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const [hydratedAuth, setHydratedAuth] = useState({ isAuthenticated: false });

  useEffect(() => {
    const stored = getStoredAuth();
    setHydratedAuth({ isAuthenticated: stored.isAuthenticated });
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAuthenticated = storeAuth || hydratedAuth.isAuthenticated;

  if (isAuthenticated) {
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
