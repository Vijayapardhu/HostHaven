import api from "@/lib/api";

export const earningsService = {
  getEarnings: async () => {
    const response = await api.get("/v1/vendor/earnings");
    return response.data;
  },

  getEarningsSummary: async () => {
    const response = await api.get("/v1/vendor/earnings/summary");
    return response.data;
  },

  getPayouts: async (params?: Record<string, string | number>) => {
    const response = await api.get("/v1/vendor/payouts", { params });
    return response.data;
  },

  getPayoutHistory: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/earnings/payouts", { params });
    return response.data;
  },
};
