import api from "./api";

export interface AnalyticsData {
  totalUsers: number;
  userGrowth: number;
  totalProperties: number;
  propertyGrowth: number;
  totalBookings: number;
  bookingGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
  bookingsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  topProperties: { name: string; bookings: number; revenue: number }[];
  bookingsByCity: { city: string; bookings: number; revenue: number }[];
  vendorPerformance: {
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
    responseTime: string;
  }[];
  cancellationStats: {
    total: number;
    rate: number;
    byReason: { reason: string; count: number }[];
  };
  paymentFailureStats: {
    total: number;
    rate: number;
    byReason: { reason: string; count: number }[];
  };
}

export const analyticsService = {
  getAnalytics: async (range: "7d" | "30d" | "3m") => {
    const response = await api.get<AnalyticsData>("/v1/admin/analytics", {
      params: { range },
    });
    return response.data?.data ?? response.data;
  },

  exportReport: async (
    type: "bookings" | "revenue" | "vendors" | "cancellations",
    range: "7d" | "30d" | "3m",
  ) => {
    const response = await api.get(`/v1/admin/analytics/export`, {
      params: { type, range },
      responseType: "blob",
    });
    const blob = new Blob([response as unknown as BlobPart], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
