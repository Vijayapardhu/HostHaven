import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
  authMethods: string[];
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ isNewUser: boolean }>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  linkGoogle: (idToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeTokens = (tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.auth.getMe();
      setUser(response.user);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    storeTokens(response.tokens);
    setUser(response.user);
  };

  const loginWithGoogle = async (idToken: string): Promise<{ isNewUser: boolean }> => {
    const response = await api.auth.loginWithGoogle(idToken);
    storeTokens(response.tokens);
    setUser(response.user);
    return { isNewUser: response.isNewUser };
  };

  const signup = async (name: string, email: string, password: string, confirmPassword: string) => {
    await api.auth.register({ name, email, password, confirmPassword });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await api.auth.logout(refreshToken || undefined);
    } catch {
      // Ignore logout API errors
    }
    clearTokens();
    setUser(null);
  };

  const linkGoogle = async (idToken: string) => {
    await api.auth.linkGoogle(idToken);
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        logout,
        linkGoogle,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
