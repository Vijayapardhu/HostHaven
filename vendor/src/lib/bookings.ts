import api from "@/lib/api";

export const bookingsService = {
  getBookings: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/bookings/vendor/bookings", { params });
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/v1/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id: string, status: string) => {
    // Map status to the correct vendor action endpoint
    if (status === "CHECKED_IN") {
      const response = await api.put(`/v1/bookings/vendor/${id}/check-in`);
      return response.data;
    }
    if (status === "CHECKED_OUT") {
      const response = await api.put(`/v1/bookings/vendor/${id}/check-out`);
      return response.data;
    }
    // For other status updates, use cancel endpoint
    if (status === "CANCELLED") {
      const response = await api.put(`/v1/bookings/${id}/cancel`);
      return response.data;
    }
    throw new Error(`Unsupported status transition: ${status}`);
  },

  quickBooking: async (data: unknown) => {
    const response = await api.post("/v1/bookings/vendor/quick-booking", data);
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await api.put(`/v1/bookings/vendor/${id}/check-in`);
    return response.data;
  },

  checkOut: async (id: string) => {
    const response = await api.put(`/v1/bookings/vendor/${id}/check-out`);
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await api.get(`/v1/bookings/vendor/${id}/invoice`);
    return response.data;
  },
};
