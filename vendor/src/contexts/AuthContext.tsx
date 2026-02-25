import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getVendorToken, removeVendorToken, setVendorToken } from "@/services/tokenService";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  refreshAuthState: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(getVendorToken()));

  const login = (token: string) => {
    setVendorToken(token);
    setIsAuthenticated(true);
  };

  const refreshAuthState = () => {
    setIsAuthenticated(Boolean(getVendorToken()));
  };

  const logout = () => {
    removeVendorToken();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const onStorage = () => refreshAuthState();
    const onUnauthorized = () => logout();

    window.addEventListener("storage", onStorage);
    window.addEventListener("vendor:unauthorized", onUnauthorized);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vendor:unauthorized", onUnauthorized);
    };
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, refreshAuthState, logout }),
    [isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
