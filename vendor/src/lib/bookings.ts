import api from "@/lib/api";

export const bookingsService = {
  getBookings: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/vendor/bookings", { params });
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/v1/vendor/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id: string, status: string) => {
    const response = await api.patch(`/v1/vendor/bookings/${id}/status`, { status });
    return response.data;
  },

  quickBooking: async (data: unknown) => {
    const response = await api.post("/v1/vendor/bookings/quick-booking", data);
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await api.post(`/v1/vendor/bookings/${id}/check-in`);
    return response.data;
  },

  checkOut: async (id: string) => {
    const response = await api.post(`/v1/vendor/bookings/${id}/check-out`);
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await api.get(`/v1/vendor/bookings/${id}/invoice`);
    return response.data;
  },
};
