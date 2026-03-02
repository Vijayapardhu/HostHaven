import api from "@/lib/api";

export const earningsService = {
  getEarningsSummary: async () => {
    const response = await api.get("/v1/vendor/earnings/summary");
    return response.data;
  },

  getPayoutHistory: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/earnings/payouts", { params });
    return response.data;
  },
};
