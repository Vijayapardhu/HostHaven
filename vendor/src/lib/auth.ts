import api from "@/lib/api";
import { setTokens, getRefreshToken } from "@/services/tokenService";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

interface LoginVendorPayload {
  email: string;
  password: string;
}

export const authService = {
  loginVendor: async ({ email, password }: LoginVendorPayload) => {
    const response = await api.post("/v1/vendor/login", { email, password });
    return response.data;
  },

  refreshToken: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await api.post("/v1/auth/refresh", { refreshToken });
    const data = response.data;
    const { accessToken, refreshToken: newRefreshToken } = data?.data ?? data;
    setTokens({ accessToken, refreshToken: newRefreshToken });
    return data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/v1/auth/forgot-password", { email });
    return getData(response.data);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/v1/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return getData(response.data);
  },

  logout: async () => {
    // Revoke the refresh token server-side so it cannot be reused after logout,
    // then clear local state regardless of the call's outcome.
    const refreshToken = getRefreshToken();
    try {
      await api.post("/v1/auth/logout", refreshToken ? { refreshToken } : {});
    } catch (error) {
      console.error("Server-side logout failed; clearing local session anyway", error);
    }
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_refresh_token");
    return { success: true };
  },
};
