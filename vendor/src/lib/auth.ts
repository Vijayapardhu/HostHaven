import api from "@/lib/api";

interface LoginVendorPayload {
  email: string;
  password: string;
}

export const authService = {
  loginVendor: async ({ email, password }: LoginVendorPayload) => {
    const response = await api.post("/v1/vendor/login", { email, password });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/v1/auth/forgot-password", { email });
    return response.data;
  },

  logout: async () => {
    // No server-side logout endpoint; clear tokens client-side
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_refresh_token");
    return { success: true };
  },
};
