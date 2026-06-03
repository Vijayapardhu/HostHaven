import { create } from "zustand";
import {
  User,
  AuthState,
  LoginCredentials,
  Permission,
  hasPermission,
} from "../types";
import apiClient from "../lib/apiClient";
import { handleError } from "../lib/errorHandler";

const TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const USER_KEY = "admin_user";
const SESSION_KEY = "admin_session_id";
const SESSION_VALIDITY_KEY = "admin_session_valid";

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ requiresMfa: boolean }>;
  logout: () => void;
  verifyMFA: (mfaCode: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
  checkAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (roles: User["role"] | User["role"][]) => boolean;
  validateSession: () => Promise<boolean>;
  initializeSession: () => Promise<void>;
  silentRefresh: () => Promise<void>;
  startSessionMonitor: () => void;
}

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    handleError(error, 'api');
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    handleError(error, 'api');
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      localStorage.clear();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    handleError(error, 'api');
  }
};

const safeParseJSON = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export const useAuthStore = create<AuthStore>()(
  (set, get) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,

    initializeSession: async () => {
      const token = safeGetItem(TOKEN_KEY);
      const refresh = safeGetItem(REFRESH_TOKEN_KEY);
      const userJson = safeGetItem(USER_KEY);

      if (!token || !refresh) {
        set({ isLoading: false });
        return;
      }

      apiClient.setAuthToken(token);
      apiClient.setRefreshToken(refresh);

      const storedUser = safeParseJSON<User | null>(userJson, null);

      if (storedUser) {
        try {
          await apiClient.get<{ expiresIn: number }>("/v1/auth/session");
          set({
            user: storedUser,
            token,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
          });
          get().startSessionMonitor();
          return;
        } catch {
          const refreshToken = safeGetItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            try {
              const refreshResponse = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>("/v1/auth/refresh", { refreshToken });
              const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data;
              
              apiClient.setAuthToken(newAccessToken);
              if (newRefreshToken) {
                apiClient.setRefreshToken(newRefreshToken);
                safeSetItem(REFRESH_TOKEN_KEY, newRefreshToken);
              }
              if (expiresIn) {
                apiClient.setTokenExpiry(expiresIn);
                const expiry = Date.now() + (expiresIn * 1000);
                safeSetItem(SESSION_VALIDITY_KEY, expiry.toString());
              }
              safeSetItem(TOKEN_KEY, newAccessToken);
              
              set({
                user: storedUser,
                token: newAccessToken,
                refreshToken: newRefreshToken,
                isAuthenticated: true,
                isLoading: false,
              });
              get().startSessionMonitor();
              return;
            } catch {
              // Session invalid, will try refresh or logout
            }
          }
          set({ isLoading: false });
          return;
        }
      }

      try {
        await get().refreshUser();
        set({ isLoading: false, isAuthenticated: true, token, refreshToken: refresh });
        get().startSessionMonitor();
      } catch {
        set({ isLoading: false });
      }
    },

    silentRefresh: async () => {
      try {
        const response = await apiClient.get<{ expiresIn: number }>("/v1/auth/session");
        if (response.data?.expiresIn) {
          const expiry = Date.now() + (response.data.expiresIn * 1000);
          safeSetItem(SESSION_VALIDITY_KEY, expiry.toString());
          apiClient.setTokenExpiry(response.data.expiresIn);
        }
      } catch {
        const refresh = safeGetItem(REFRESH_TOKEN_KEY);
        if (refresh) {
          try {
            const refreshResponse = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>("/v1/auth/refresh", { refreshToken: refresh });
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data;
            apiClient.setAuthToken(accessToken);
            if (newRefreshToken) {
              apiClient.setRefreshToken(newRefreshToken);
              safeSetItem(REFRESH_TOKEN_KEY, newRefreshToken);
            }
            if (expiresIn) {
              apiClient.setTokenExpiry(expiresIn);
              const expiry = Date.now() + (expiresIn * 1000);
              safeSetItem(SESSION_VALIDITY_KEY, expiry.toString());
            }
          } catch (refreshError) {
            if (refreshError && typeof refreshError === 'object' && 'status' in refreshError && (refreshError.status === 401 || refreshError.status === 'UNAUTHORIZED' || refreshError.status === 'INVALID_TOKEN')) {
              get().logout();
              window.dispatchEvent(new CustomEvent('auth:logout'));
            }
          }
        } else {
          get().logout();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
    },

    startSessionMonitor: () => {
      if (typeof window === "undefined") return;

      const checkInterval = 60 * 1000;
      
      const intervalId = setInterval(() => {
        const validityStr = safeGetItem(SESSION_VALIDITY_KEY);
        if (!validityStr) return;

        const validity = parseInt(validityStr, 10);
        const now = Date.now();
        const bufferTime = 5 * 60 * 1000;

        if (validity - now < bufferTime) {
          get().silentRefresh();
        }
      }, checkInterval);

      window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
      });
    },

    validateSession: async (): Promise<boolean> => {
      const token = safeGetItem(TOKEN_KEY);
      if (!token) return false;

      try {
        const response = await apiClient.get<{ expiresIn: number }>("/v1/auth/session");
        if (response.data?.expiresIn) {
          apiClient.setTokenExpiry(response.data.expiresIn);
          safeSetItem(SESSION_VALIDITY_KEY, (Date.now() + response.data.expiresIn * 1000).toString());
        } else {
          safeSetItem(SESSION_VALIDITY_KEY, (Date.now() + 30 * 60 * 1000).toString());
        }
        return true;
      } catch {
        const refresh = safeGetItem(REFRESH_TOKEN_KEY);
        if (refresh) {
          try {
            const refreshResponse = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>("/v1/auth/refresh", { refreshToken: refresh });
            const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshResponse.data;
            apiClient.setAuthToken(accessToken);
            if (newRefreshToken) {
              apiClient.setRefreshToken(newRefreshToken);
              safeSetItem(REFRESH_TOKEN_KEY, newRefreshToken);
            }
            if (expiresIn) {
              apiClient.setTokenExpiry(expiresIn);
              safeSetItem(SESSION_VALIDITY_KEY, (Date.now() + expiresIn * 1000).toString());
            } else {
              safeSetItem(SESSION_VALIDITY_KEY, (Date.now() + 30 * 60 * 1000).toString());
            }
            return true;
          } catch (refreshError) {
            if (refreshError && typeof refreshError === 'object' && 'status' in refreshError && (refreshError.status === 401 || refreshError.status === 'UNAUTHORIZED' || refreshError.status === 'INVALID_TOKEN')) {
              get().logout();
              window.dispatchEvent(new CustomEvent('auth:logout'));
            }
            return false;
          }
        }
        return false;
      }
    },

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true });

      try {
        const response = await apiClient.post<{
          user: User;
          tokens: { accessToken: string; refreshToken: string; expiresIn?: number };
          requiresMfa?: boolean;
        }>("/v1/auth/login", credentials);

        const { user, tokens, requiresMfa } = response.data;
        const { accessToken, refreshToken, expiresIn } = tokens;

        const mappedUser: User = {
          id: user.id,
          email: user.email,
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        };

        if (requiresMfa) {
          set({ isLoading: false });
          return { requiresMfa: true };
        }

        apiClient.setAuthToken(accessToken);
        apiClient.setRefreshToken(refreshToken);

        const expirySeconds = expiresIn || (30 * 60);
        if (expiresIn) {
          const expiry = Date.now() + (expiresIn * 1000);
          safeSetItem(SESSION_VALIDITY_KEY, expiry.toString());
        } else {
          safeSetItem(SESSION_VALIDITY_KEY, (Date.now() + 30 * 60 * 1000).toString());
        }
        apiClient.setTokenExpiry(expirySeconds);

        const newSessionId = generateSessionId();
        safeSetItem(TOKEN_KEY, accessToken);
        safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
        safeSetItem(USER_KEY, JSON.stringify(mappedUser));
        safeSetItem(SESSION_KEY, newSessionId);

        set({
          user: mappedUser,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        get().startSessionMonitor();

        return { requiresMfa: false };
      } catch (error) {
        handleError(error, 'auth');
        set({ isLoading: false });
        throw error;
      }
    },

    logout: () => {
      apiClient.clearTokens();

      safeRemoveItem(TOKEN_KEY);
      safeRemoveItem(REFRESH_TOKEN_KEY);
      safeRemoveItem(USER_KEY);
      safeRemoveItem(SESSION_KEY);
      safeRemoveItem(SESSION_VALIDITY_KEY);

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    verifyMFA: async (mfaCode: string) => {
      set({ isLoading: true });
      try {
        const response = await apiClient.post<{
          user: User;
          tokens: { accessToken: string; refreshToken: string; expiresIn?: number };
        }>("/v1/auth/verify-mfa", { mfaCode });

        const { user, tokens } = response.data;
        const { accessToken, refreshToken, expiresIn } = tokens;

        apiClient.setAuthToken(accessToken);
        apiClient.setRefreshToken(refreshToken);

        const mfaExpirySeconds = expiresIn || (30 * 60);
        if (expiresIn) {
          const expiry = Date.now() + (expiresIn * 1000);
          safeSetItem(SESSION_VALIDITY_KEY, expiry.toString());
        } else {
          safeSetItem(SESSION_VALIDITY_KEY, (Date.now() + 30 * 60 * 1000).toString());
        }
        apiClient.setTokenExpiry(mfaExpirySeconds);

        const newSessionId = generateSessionId();
        safeSetItem(TOKEN_KEY, accessToken);
        safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
        safeSetItem(USER_KEY, JSON.stringify(user));
        safeSetItem(SESSION_KEY, newSessionId);

        set({
          user,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        get().startSessionMonitor();
      } catch (error) {
        handleError(error, 'auth');
        set({ isLoading: false });
        throw error;
      }
    },

    refreshUser: async () => {
      try {
        const response = await apiClient.get<User>("/v1/auth/me");
        const user = response.data;

        safeSetItem(USER_KEY, JSON.stringify(user));
        set({ user });
      } catch (error) {
        handleError(error, 'auth');
        throw error;
      }
    },

    checkPermission: (permission: Permission) => {
      const { user } = get();
      return hasPermission(user, permission);
    },

    checkAnyPermission: (permissions: Permission[]) => {
      const { user } = get();
      if (!user) return false;
      return permissions.some((p) => hasPermission(user, p));
    },

    hasRole: (roles) => {
      const { user } = get();
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
  })
);

export default useAuthStore;
