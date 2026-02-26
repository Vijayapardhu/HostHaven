import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  AuthState,
  LoginCredentials,
  Permission,
  hasPermission,
} from "../types";
import apiClient from "../lib/apiClient";

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ requiresMfa: boolean }>;
  logout: () => void;
  verifyMFA: (mfaCode: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
  checkAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (roles: User["role"] | User["role"][]) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<{
            user: User;
            tokens: { accessToken: string; refreshToken: string };
            requiresMfa?: boolean;
          }>("/v1/auth/login", credentials);

          const { user, tokens, requiresMfa } = response.data;
          const { accessToken, refreshToken } = tokens;

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

          localStorage.setItem("admin_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
          localStorage.setItem("admin_data", JSON.stringify(mappedUser));

          set({
            user: mappedUser,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return { requiresMfa: false };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        apiClient.clearTokens();
        localStorage.removeItem("admin_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_data");
        localStorage.removeItem("auth-storage");
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      verifyMFA: async (mfaCode: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<{
            user: User;
            tokens: { accessToken: string; refreshToken: string };
          }>("/v1/auth/verify-mfa", { mfaCode });

          const { user, tokens } = response.data;
          const { accessToken, refreshToken } = tokens;

          apiClient.setAuthToken(accessToken);
          apiClient.setRefreshToken(refreshToken);

          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshUser: async () => {
        try {
          const response = await apiClient.get<User>("/v1/auth/me");
          set({ user: response.data });
        } catch (error) {
          get().logout();
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
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
