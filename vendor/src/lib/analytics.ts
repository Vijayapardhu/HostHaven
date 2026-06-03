import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const analyticsService = {
  // This is not used - analytics are calculated from bookings in VendorAnalytics page
  // Keeping for future use if needed
  getAnalytics: async (months?: number) => {
    const params = months ? `?months=${months}` : '';
    // Use dashboard endpoint which provides the data
    const response = await api.get(`/v1/vendor/dashboard${params}`);
    return getData(response.data);
  },
};
