import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const earningsService = {
  getEarningsSummary: async () => {
    const response = await api.get("/v1/vendor/earnings/summary");
    return getData(response.data);
  },

  getPayoutHistory: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/earnings/payouts", { params });
    return getData(response.data);
  },

  requestPayout: async (amount?: number) => {
    const response = await api.post("/v1/vendor/earnings/payouts", { amount });
    return getData(response.data);
  },
};
