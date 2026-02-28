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
    const response = await api.post("/v1/vendor/forgot-password", { email });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put("/v1/vendor/password", { currentPassword, newPassword });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/v1/vendor/logout");
    return response.data;
  },
};
